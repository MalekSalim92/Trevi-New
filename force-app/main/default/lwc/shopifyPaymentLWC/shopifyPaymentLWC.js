import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOrderDetails from '@salesforce/apex/ShopifyPaymentService.getOrderDetails';
import makePaymentSync from '@salesforce/apex/ShopifyPaymentService.makePaymentSync';
import getRedirectUrl from '@salesforce/apex/ShopifyPaymentService.getRedirectUrl';
import messageErrorPopup from "@salesforce/label/c.Payment_error_popup_blocked";
import { CloseActionScreenEvent } from 'lightning/actions';

export default class ShopifyPaymentLWC extends LightningElement {
    
    @api recordId;    // From Flow or button context
    @api orderId;    // From Flow 
    @api amount;    // From Flow 
    @api paymentUrl;  // Direct payment URL input from Flow
    @api redirectionUrl; // redirection URL after payment completion
    isLoading = false;
    popupBlocked = false;

    label = {
        messageErrorPopup
    };
    // ----------------------
    // Lifecycle hooks
    // ----------------------
    
    connectedCallback() {
        console.log('Component loaded - recordId:', this.recordId, '  -  Order  Id :' + this.orderId + '  - paymentUrl:', this.paymentUrl);
        
        // Case 1: Payment URL provided - open popup and redirect
        if (this.paymentUrl) {
            console.log('Payment URL provided - opening popup and redirecting');
            this.openPaymentPopup(this.paymentUrl);
            this.redirectMainWindow();
            this.closeAction();
            return;
        }
        
        // Case 2: No payment URL - get Order ID and process
        const orderIdToUse = this.recordId || this.orderId || this.getRecordIdFromUrl();
        console.log('orderIdToUse:', orderIdToUse);

        if (orderIdToUse) {
            this.processOrderPayment(orderIdToUse);
        } else {
            this.showError('No Order ID found');
        }
    }

    // ----------------------
    // Core Logic
    // ----------------------
    
    async processOrderPayment(orderIdToUse) {
        this.isLoading = true;
        
        try {
            // Check if Order already has payment URL
            const orderRecord = await getOrderDetails({ recordId: orderIdToUse });
            if(orderRecord && orderRecord.TotalAmount <= 0){
                this.showError('Total amount must be greater than 0');
            }
            else if (orderRecord && orderRecord.Shopify_payment_url__c) {
                console.log('Existing payment URL found:', orderRecord.Shopify_payment_url__c);
                this.openPaymentPopup(orderRecord.Shopify_payment_url__c);
            } else {
                console.log('No existing URL - making API call');
                // Make API call to get new payment URL
                const result = await makePaymentSync({orderIds: [orderIdToUse] , amount : this.amount});

                console.log(JSON.stringify(result));

                if (result.length > 0 && result[0].success && result[0].paymentUrl) {
                    console.log('New payment URL received:', result[0].paymentUrl);
                    this.openPaymentPopup(result[0].paymentUrl);
                } else {
                    this.showError(result[0].errorMessage || 'Failed to get payment URL');
                }
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showError('Error processing payment: ' + (error.body?.message || error.message));
        } finally {
            this.isLoading = false;
            this.closeAction();
        }
    }

    // ----------------------
    // Helper Methods
    // ----------------------

    openPaymentPopup(url) {
        if (!url) {
            this.showError('Payment URL is not available');
            return;
        }
        
        console.log('Opening payment popup:', url);
        
        const popup = window.open(
            url,
            'paymentWindow',
            'width=800,height=600,left=100,top=100,resizable=yes,scrollbars=yes'
        );
        
        if (!popup) {
            this.showError('Popup blocked. Please allow popups and try again.');
            this.popupBlocked = true;
            
        }
        

    }

    async redirectMainWindow() {
        console.log('Redirecting main window...');
        try {
            const redirectUrl = await getRedirectUrl({ urlRedirectionName: this.redirectionUrl });
            console.log('Retrieved redirect URL:', redirectUrl);
            
            if (redirectUrl) {
                // Small delay to ensure popup opens first
                setTimeout(() => {
                    console.log('Redirecting to:', redirectUrl);
                    window.location.href = redirectUrl;
                }, 10000);
            } else {
                console.log('No redirect URL found in custom metadata');
            }
        } catch (error) {
            console.error('Error retrieving redirect URL:', error);
        }
    }

    getRecordIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('recordId') || this.extractIdFromUrl();
    }
    
    extractIdFromUrl() {
        const url = window.location.href;
        const idMatch = url.match(/[a-zA-Z0-9]{15,18}/);
        return idMatch ? idMatch[0] : null;
    }
    
    showError(message) {
        console.error('Error:', message);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error'
        }));
    }

    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}