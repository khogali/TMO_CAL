import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jsforce from "jsforce";

// Initialize the Firebase Admin SDK to interact with Firebase services
admin.initializeApp();

/**
 * A placeholder function to simulate sending a notification.
 */
const sendNotification = (leadName: string, followUpTime: string) => {
  functions.logger.info(`--- NOTIFICATION SIMULATION ---`);
  functions.logger.info(`A notification would be sent for lead: "${leadName}"`);
  functions.logger.info(`Scheduled follow-up time: ${followUpTime}`);
  functions.logger.info(`-----------------------------`);
};

/**
 * Cloud Function: onFollowUpSet
 * Triggers when a lead is updated to check for new follow-up times.
 */
export const onFollowUpSet = functions.database.ref('/leads/{leadId}')
    .onUpdate(async (change) => {
        const beforeData = change.before.val();
        const afterData = change.after.val();

        if (afterData.followUpAt && beforeData.followUpAt !== afterData.followUpAt) {
            const leadName = afterData.customerName || 'Unnamed Lead';
            const followUpTime = new Date(afterData.followUpAt).toLocaleString();
            
            functions.logger.info(`Follow-up time set for lead "${leadName}" (${change.params.leadId}).`);
            sendNotification(leadName, followUpTime);
        }

        return null;
    });

/**
 * Cloud Function: syncLeadToSalesforce
 * Triggers on any write to the leads path.
 * Syncs the lead data to Salesforce if configured.
 * 
 * SETUP INSTRUCTIONS:
 * Run the following command to configure Salesforce credentials:
 * firebase functions:config:set salesforce.username="YOUR_USER" salesforce.password="YOUR_PASS" salesforce.token="YOUR_TOKEN" salesforce.login_url="https://login.salesforce.com"
 */
export const syncLeadToSalesforce = functions.database.ref('/leads/{leadId}')
    .onWrite(async (change, context) => {
        const leadId = context.params.leadId;
        const leadData = change.after.val();
        const beforeData = change.before.val();

        // 1. Exit if the lead was deleted
        if (!leadData) {
            functions.logger.info(`Lead ${leadId} was deleted. Skipping Salesforce sync.`);
            return null;
        }

        // 2. Prevent Infinite Loops
        // If the only thing that changed was the salesforceId or lastSyncedAt (which we write back), exit.
        if (beforeData && leadData.salesforceId === beforeData.salesforceId && leadData.lastSyncedAt !== beforeData.lastSyncedAt) {
             return null;
        }

        // 3. Get Credentials from Environment Config
        const sfConfig = functions.config().salesforce;
        if (!sfConfig || !sfConfig.username || !sfConfig.password) {
            functions.logger.warn("Salesforce credentials not configured. Skipping sync.");
            return null;
        }

        try {
            // 4. Connect to Salesforce
            const conn = new jsforce.Connection({
                loginUrl: sfConfig.login_url || 'https://login.salesforce.com'
            });

            await conn.login(sfConfig.username, sfConfig.password + (sfConfig.token || ''));

            // 5. Map Data to Salesforce 'Lead' Object
            // We split the full name into First/Last because SF requires LastName.
            const fullName = leadData.customerName || 'Unknown Customer';
            const nameParts = fullName.split(' ');
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : fullName;
            const firstName = nameParts.length > 1 ? nameParts[0] : '';

            const sfRecord = {
                FirstName: firstName,
                LastName: lastName,
                Company: 'T-Mobile Consumer', // Mandatory field for Leads
                Phone: leadData.customerPhone,
                Status: mapStatusToSalesforce(leadData.status),
                Description: `Notes: ${leadData.notes}\n\nT-Mobile App Link: lead/${leadId}`,
                // You can add custom fields here if your SF instance has them, e.g., T_Mobile_Store_ID__c: leadData.storeId
            };

            // 6. Upsert the Record
            // If we already have a Salesforce ID, use it to update. Otherwise create.
            let ret;
            if (leadData.salesforceId) {
                // Update existing
                ret = await conn.sobject('Lead').update({ Id: leadData.salesforceId, ...sfRecord });
            } else {
                // Create new
                // Advanced: You could search by Phone first to avoid duplicates if salesforceId is missing
                ret = await conn.sobject('Lead').create(sfRecord);
            }

            if (ret.success) {
                functions.logger.info(`Successfully synced lead ${leadId} to Salesforce. SF ID: ${ret.id}`);
                
                // 7. Write Back to Firebase (only if ID is new or just to confirm sync time)
                // We use a specific update to avoid re-triggering the whole object change if possible, 
                // though onWrite triggers on any change. The loop check at step 2 prevents recursion.
                if (leadData.salesforceId !== ret.id) {
                    await change.after.ref.update({
                        salesforceId: ret.id,
                        lastSyncedAt: Date.now()
                    });
                } else {
                     await change.after.ref.update({
                        lastSyncedAt: Date.now()
                    });
                }
            } else {
                functions.logger.error(`Salesforce sync failed for lead ${leadId}:`, ret.errors);
            }

        } catch (error) {
            functions.logger.error(`Error connecting to Salesforce for lead ${leadId}:`, error);
        }

        return null;
    });

// Helper to map internal status to standard Salesforce Lead statuses
function mapStatusToSalesforce(status: string): string {
    switch (status) {
        case 'New': return 'Open - Not Contacted';
        case 'Contacted': return 'Working - Contacted';
        case 'Follow-up': return 'Working - Contacted';
        case 'Closed - Won': return 'Closed - Converted';
        case 'Closed - Lost': return 'Closed - Not Converted';
        default: return 'Open - Not Contacted';
    }
}
