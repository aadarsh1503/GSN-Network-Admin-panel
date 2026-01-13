import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

// Create transporter with GSN branding
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email template generators
const generateQuoteRequestUserEmail = (data) => {
  return {
    subject: `Quote Request Confirmation - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">Quote Request Submitted Successfully</h2>
          
          <p>Dear ${data.requestedBy?.name || 'Valued Customer'},</p>
          <p>Your quote request has been successfully submitted to our network of companies. Here are the details:</p>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Submitted:</td><td>${data.submittedAt}</td></tr>
              ${data.shippingMode ? `<tr><td style="padding: 8px 0; font-weight: bold;">Shipping Mode:</td><td>${data.shippingMode}</td></tr>` : ''}
              ${data.arrivalDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Arrival Date:</td><td>${data.arrivalDate}</td></tr>` : ''}
              ${data.departureCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">From:</td><td>${data.departureCountry}${data.departureState ? ', ' + data.departureState : ''}${data.departureCity ? ', ' + data.departureCity : ''}${data.departureType ? ' (' + data.departureType + ')' : ''}</td></tr>` : ''}
              ${data.arrivalCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">To:</td><td>${data.arrivalCountry}${data.arrivalState ? ', ' + data.arrivalState : ''}${data.arrivalCity ? ', ' + data.arrivalCity : ''}${data.arrivalType ? ' (' + data.arrivalType + ')' : ''}</td></tr>` : ''}
              ${data.productDescription ? `<tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td>${data.productDescription}</td></tr>` : ''}
              ${data.packing ? `<tr><td style="padding: 8px 0; font-weight: bold;">Packing:</td><td>${data.packing}</td></tr>` : ''}
              ${data.type ? `<tr><td style="padding: 8px 0; font-weight: bold;">Cargo Type:</td><td>${data.type}</td></tr>` : ''}
              ${data.quantity ? `<tr><td style="padding: 8px 0; font-weight: bold;">Quantity:</td><td>${data.quantity}</td></tr>` : ''}
              ${data.weight ? `<tr><td style="padding: 8px 0; font-weight: bold;">Weight:</td><td>${data.weight}</td></tr>` : ''}
              ${data.length && data.width && data.height ? `<tr><td style="padding: 8px 0; font-weight: bold;">Dimensions:</td><td>${data.length} x ${data.width} x ${data.height} ${data.dimensionUnit || ''}</td></tr>` : ''}
              ${data.incoterms ? `<tr><td style="padding: 8px 0; font-weight: bold;">Incoterms:</td><td>${data.incoterms}</td></tr>` : ''}
            </table>
          </div>
          
          ${(data.isStackable !== undefined || data.isHazardous !== undefined || data.hasInsurance !== undefined) ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Additional Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.isStackable !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Stackable:</td><td>${data.isStackable ? '✅ Yes' : '❌ No'}</td></tr>` : ''}
              ${data.isHazardous !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Hazardous:</td><td>${data.isHazardous ? '⚠️ Yes' : '✅ No'}</td></tr>` : ''}
              ${data.hasInsurance !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Cargo Insurance:</td><td>${data.hasInsurance ? '🛡️ Yes' : '❌ No'}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          ${data.notes ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #2c3e50; margin-top: 0;">Special Notes</h3>
            <p style="margin: 0; color: #495057;">${data.notes}</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
            <p style="margin: 0; color: #27ae60; font-weight: bold;">✓ What happens next?</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Companies in our network will review your request</li>
              <li>You'll receive email notifications when companies respond</li>
              <li>Compare quotes and choose the best option for your needs</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">Thank you for choosing GSN Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateQuoteRequestCompanyEmail = (data) => {
  // Check if company has subscription restrictions
  const hasSubscriptionRestrictions = data.companySubscription && (
    data.companySubscription.maxResponses === 0 || 
    (data.companySubscription.maxResponses !== -1 && 
     data.companySubscription.currentResponses >= data.companySubscription.maxResponses)
  );

  // Hide contact information for restricted companies
  const getContactInfo = (info, placeholder = 'Contact Info Hidden') => {
    return hasSubscriptionRestrictions ? placeholder : (info || 'N/A');
  };

  const restrictionNotice = hasSubscriptionRestrictions ? `
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin-top: 0;">🔒 Subscription Upgrade Required</h3>
      <p style="margin: 0; color: #856404;">
        ${data.companySubscription?.maxResponses === 0 
          ? 'You\'re on a basic plan with 0 responses. Upgrade your subscription to see customer contact information and respond to quotes.'
          : `You've used all ${data.companySubscription?.maxResponses} responses this month. Upgrade to get more responses and access customer details.`
        }
      </p>
      <div style="text-align: center; margin-top: 15px;">
        <a href="${process.env.FRONTEND_URL}/company/plans" style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Upgrade Plan Now
        </a>
      </div>
    </div>
  ` : '';

  return {
    subject: `New Quote Request Available - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 10px;">New Quote Request Available</h2>
          
          <p>A new quote request has been submitted that matches your services. Review the details below:</p>
          
          ${restrictionNotice}
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Submitted:</td><td>${data.submittedAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${getContactInfo(data.requestedBy?.name)} (${data.requestedBy?.role || 'guest'})</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Contact Email:</td><td>${hasSubscriptionRestrictions ? '<span style="filter: blur(4px);">contact@email.com</span> 🔒' : (data.requestedBy?.email || 'N/A')}</td></tr>
              ${data.requestedBy?.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${hasSubscriptionRestrictions ? '<span style="filter: blur(4px);">+XXX XXX XXXX</span> 🔒' : data.requestedBy.phone}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Shipping Requirements</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.shippingMode ? `<tr><td style="padding: 8px 0; font-weight: bold;">Shipping Mode:</td><td>${data.shippingMode}</td></tr>` : ''}
              ${data.arrivalDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Arrival Date:</td><td>${data.arrivalDate}</td></tr>` : ''}
              ${data.departureCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">From:</td><td>${data.departureCountry}${data.departureState ? ', ' + data.departureState : ''}${data.departureCity ? ', ' + data.departureCity : ''}${data.departureType ? ' (' + data.departureType + ')' : ''}</td></tr>` : ''}
              ${data.arrivalCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">To:</td><td>${data.arrivalCountry}${data.arrivalState ? ', ' + data.arrivalState : ''}${data.arrivalCity ? ', ' + data.arrivalCity : ''}${data.arrivalType ? ' (' + data.arrivalType + ')' : ''}</td></tr>` : ''}
              ${data.incoterms ? `<tr><td style="padding: 8px 0; font-weight: bold;">Incoterms:</td><td>${data.incoterms}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Cargo Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.productDescription ? `<tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td>${data.productDescription}</td></tr>` : ''}
              ${data.packing ? `<tr><td style="padding: 8px 0; font-weight: bold;">Packing:</td><td>${data.packing}</td></tr>` : ''}
              ${data.type ? `<tr><td style="padding: 8px 0; font-weight: bold;">Cargo Type:</td><td>${data.type}</td></tr>` : ''}
              ${data.quantity ? `<tr><td style="padding: 8px 0; font-weight: bold;">Quantity:</td><td>${data.quantity}</td></tr>` : ''}
              ${data.weight ? `<tr><td style="padding: 8px 0; font-weight: bold;">Weight:</td><td>${data.weight}</td></tr>` : ''}
              ${data.length && data.width && data.height ? `<tr><td style="padding: 8px 0; font-weight: bold;">Dimensions:</td><td>${data.length} x ${data.width} x ${data.height} ${data.dimensionUnit || ''}</td></tr>` : ''}
            </table>
          </div>
          
          ${(data.isStackable !== undefined || data.isHazardous !== undefined || data.hasInsurance !== undefined) ? `
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">⚠️ Important Cargo Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.isStackable !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Stackable:</td><td>${data.isStackable ? '✅ Yes' : '❌ No'}</td></tr>` : ''}
              ${data.isHazardous !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Hazardous:</td><td>${data.isHazardous ? '⚠️ Yes - Special handling required' : '✅ No'}</td></tr>` : ''}
              ${data.hasInsurance !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Cargo Insurance:</td><td>${data.hasInsurance ? '🛡️ Required' : '❌ Not required'}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          ${data.notes ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Special Notes</h3>
            <p style="margin: 0; color: #495057; font-style: italic;">"${data.notes}"</p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
            <p style="margin: 0; color: #3498db; font-weight: bold;">💼 Action Required</p>
            <p style="margin: 10px 0;">
              ${hasSubscriptionRestrictions 
                ? 'Upgrade your subscription to access customer contact information and respond to this quote.'
                : 'Log in to your GSN Network company panel to review this request and submit your competitive quote.'
              }
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateQuoteResponseEmail = (data) => {
  return {
    subject: `Quote Response Received - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #e67e22; border-bottom: 2px solid #e67e22; padding-bottom: 10px;">New Quote Response</h2>
          
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>You have received a new quote response for your request #${data.quoteId}:</p>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Company Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Contact:</td><td>${data.companyEmail || 'N/A'}</td></tr>
              ${data.companyPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${data.companyPhone}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e67e22;">
            <h3 style="color: #2c3e50; margin-top: 0;">Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Price:</td><td style="font-size: 18px; color: #e67e22; font-weight: bold;">$${data.price || 'Contact for pricing'}</td></tr>
              ${data.currency ? `<tr><td style="padding: 8px 0; font-weight: bold;">Currency:</td><td>${data.currency}</td></tr>` : ''}
              ${data.validUntil ? `<tr><td style="padding: 8px 0; font-weight: bold;">Valid Until:</td><td>${data.validUntil}</td></tr>` : ''}
              ${data.transitTime ? `<tr><td style="padding: 8px 0; font-weight: bold;">Transit Time:</td><td>${data.transitTime}</td></tr>` : ''}
              ${data.notes ? `<tr><td style="padding: 8px 0; font-weight: bold;">Notes:</td><td>${data.notes}</td></tr>` : ''}
            </table>
          </div>
          
          ${data.bankDetails ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Payment Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.bankDetails.bankName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Bank Name:</td><td>${data.bankDetails.bankName}</td></tr>` : ''}
              ${data.bankDetails.accountName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Account Holder Name:</td><td>${data.bankDetails.accountName}</td></tr>` : ''}
              ${data.bankDetails.accountNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">Account Number:</td><td>${data.bankDetails.accountNumber}</td></tr>` : ''}
              ${data.bankDetails.branchName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Branch Name:</td><td>${data.bankDetails.branchName}</td></tr>` : ''}
              ${data.bankDetails.ibanNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">IBAN Number:</td><td>${data.bankDetails.ibanNumber}</td></tr>` : ''}
              ${data.bankDetails.swiftCode ? `<tr><td style="padding: 8px 0; font-weight: bold;">SWIFT Code:</td><td>${data.bankDetails.swiftCode}</td></tr>` : ''}
              ${data.bankDetails.routingNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">Routing Number:</td><td>${data.bankDetails.routingNumber}</td></tr>` : ''}
              ${data.bankDetails.paymentInstructions ? `<tr><td style="padding: 8px 0; font-weight: bold;">Payment Instructions:</td><td>${data.bankDetails.paymentInstructions}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
            <p style="margin: 0; color: #3498db; font-weight: bold;">📋 Next Steps</p>
            <p style="margin: 10px 0;">Review this quote in your GSN Network dashboard. You can accept, negotiate, or continue receiving more quotes from other companies.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateQuoteAcceptanceUserEmail = (data) => {
  return {
    subject: `Quote Accepted - Booking Confirmed - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">🎉 Booking Confirmed!</h2>
          
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>Congratulations! Your quote has been accepted and your booking is confirmed.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Final Price:</td><td style="font-size: 18px; color: #27ae60; font-weight: bold;">$${data.price || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Accepted On:</td><td>${data.acceptedAt || new Date().toLocaleDateString()}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Company Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${data.companyEmail || 'N/A'}</td></tr>
              ${data.companyPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${data.companyPhone}</td></tr>` : ''}
              ${data.companyAddress ? `<tr><td style="padding: 8px 0; font-weight: bold;">Address:</td><td>${data.companyAddress}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
            <p style="margin: 0; color: #f39c12; font-weight: bold;">📞 Important</p>
            <p style="margin: 10px 0;">The company will contact you directly to coordinate the logistics and payment details. Please keep this email for your records.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">Thank you for choosing GSN Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateQuoteAcceptanceCompanyEmail = (data) => {
  return {
    subject: `🎉 Quote Accepted - New Booking - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">🎉 Congratulations! Quote Accepted</h2>
          
          <p>Great news! Your quote has been accepted by the customer. Here are the booking details:</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #2c3e50; margin-top: 0;">Booking Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${data.userName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.userEmail || 'N/A'}</td></tr>
              ${data.userPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Customer Phone:</td><td>${data.userPhone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; font-weight: bold;">Accepted Price:</td><td style="font-size: 18px; color: #27ae60; font-weight: bold;">$${data.acceptedPrice || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Accepted On:</td><td>${data.acceptedAt || new Date().toLocaleDateString()}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Original Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.originalQuote?.shippingMode ? `<tr><td style="padding: 8px 0; font-weight: bold;">Shipping Mode:</td><td>${data.originalQuote.shippingMode}</td></tr>` : ''}
              ${data.originalQuote?.arrivalDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Arrival Date:</td><td>${data.originalQuote.arrivalDate}</td></tr>` : ''}
              ${data.originalQuote?.departureCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">From:</td><td>${data.originalQuote.departureCountry}${data.originalQuote.departureState ? ', ' + data.originalQuote.departureState : ''}${data.originalQuote.departureCity ? ', ' + data.originalQuote.departureCity : ''}</td></tr>` : ''}
              ${data.originalQuote?.arrivalCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">To:</td><td>${data.originalQuote.arrivalCountry}${data.originalQuote.arrivalState ? ', ' + data.originalQuote.arrivalState : ''}${data.originalQuote.arrivalCity ? ', ' + data.originalQuote.arrivalCity : ''}</td></tr>` : ''}
              ${data.originalQuote?.productDescription ? `<tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td>${data.originalQuote.productDescription}</td></tr>` : ''}
              ${data.originalQuote?.packing ? `<tr><td style="padding: 8px 0; font-weight: bold;">Packing:</td><td>${data.originalQuote.packing}</td></tr>` : ''}
              ${data.originalQuote?.type ? `<tr><td style="padding: 8px 0; font-weight: bold;">Cargo Type:</td><td>${data.originalQuote.type}</td></tr>` : ''}
              ${data.originalQuote?.quantity ? `<tr><td style="padding: 8px 0; font-weight: bold;">Quantity:</td><td>${data.originalQuote.quantity}</td></tr>` : ''}
              ${data.originalQuote?.weight ? `<tr><td style="padding: 8px 0; font-weight: bold;">Weight:</td><td>${data.originalQuote.weight}</td></tr>` : ''}
              ${data.originalQuote?.incoterms ? `<tr><td style="padding: 8px 0; font-weight: bold;">Incoterms:</td><td>${data.originalQuote.incoterms}</td></tr>` : ''}
            </table>
          </div>
          
          ${(data.originalQuote?.isStackable !== undefined || data.originalQuote?.isHazardous !== undefined || data.originalQuote?.hasInsurance !== undefined) ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Cargo Requirements</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.originalQuote?.isStackable !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Stackable:</td><td>${data.originalQuote.isStackable ? '✅ Yes' : '❌ No'}</td></tr>` : ''}
              ${data.originalQuote?.isHazardous !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Hazardous:</td><td>${data.originalQuote.isHazardous ? '⚠️ Yes' : '✅ No'}</td></tr>` : ''}
              ${data.originalQuote?.hasInsurance !== undefined ? `<tr><td style="padding: 8px 0; font-weight: bold;">Insurance:</td><td>${data.originalQuote.hasInsurance ? '🛡️ Required' : '❌ Not required'}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          ${data.notes ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #2c3e50; margin-top: 0;">Customer Notes</h3>
            <p style="margin: 0; color: #495057; font-style: italic;">"${data.notes}"</p>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
            <p style="margin: 0; color: #f39c12; font-weight: bold;">📞 Next Steps</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Contact the customer directly to coordinate logistics</li>
              <li>Arrange payment and documentation</li>
              <li>Update the booking status in your GSN Network panel</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Subscription deletion email templates
const generateSubscriptionDeletionUserEmail = (data) => {
  return {
    subject: `Subscription Cancelled - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">Subscription Cancelled</h2>
          
          <p>Dear ${data.userName},</p>
          <p>We regret to inform you that your GSN Network subscription has been cancelled by our administration team.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Cancellation Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Subscription ID:</td><td>#${data.subscriptionId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Plan Name:</td><td>${data.planName || 'N/A'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Cancelled On:</td><td>${data.cancelledAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td style="color: #dc3545; font-weight: bold;">${data.reason}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Subscription Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Member Name:</td><td>${data.userName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${data.userEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Role:</td><td style="text-transform: capitalize;">${data.userRole}</td></tr>
              ${data.planPrice ? `<tr><td style="padding: 8px 0; font-weight: bold;">Plan Price:</td><td>$${data.planPrice}</td></tr>` : ''}
              ${data.durationMonths ? `<tr><td style="padding: 8px 0; font-weight: bold;">Duration:</td><td>${data.durationMonths} months</td></tr>` : ''}
              ${data.startDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Start Date:</td><td>${data.startDate}</td></tr>` : ''}
              ${data.endDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">End Date:</td><td>${data.endDate}</td></tr>` : ''}
              ${data.amountPaid ? `<tr><td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td><td>$${data.amountPaid}</td></tr>` : ''}
              ${data.paymentStatus ? `<tr><td style="padding: 8px 0; font-weight: bold;">Payment Status:</td><td>${data.paymentStatus}</td></tr>` : ''}
            </table>
          </div>
          
          ${data.cancelledInvoices > 0 ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📄 Invoice Information</h3>
            <p style="margin: 0; color: #856404;">
              ${data.cancelledInvoices} related invoice(s) have been marked as cancelled. You can still access them for your records, but no further payments are required.
            </p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">📞 Need Help?</p>
            <p style="margin: 10px 0;">If you have any questions about this cancellation or would like to discuss reactivating your subscription, please contact our support team.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateSubscriptionDeletionAdminEmail = (data) => {
  return {
    subject: `Subscription Deleted - Admin Notification - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Admin Panel</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">🗑️ Subscription Deleted</h2>
          
          <p>A subscription has been successfully deleted from the system.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Deletion Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Subscription ID:</td><td>#${data.subscriptionId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Deleted On:</td><td>${data.cancelledAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Deleted By:</td><td>Admin</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td style="color: #dc3545; font-weight: bold;">${data.reason}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Member Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Member Name:</td><td>${data.userName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${data.userEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Role:</td><td style="text-transform: capitalize;">${data.userRole}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">User ID:</td><td>${data.userId}</td></tr>
            </table>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Subscription Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Plan Name:</td><td>${data.planName || 'N/A'}</td></tr>
              ${data.planPrice ? `<tr><td style="padding: 8px 0; font-weight: bold;">Plan Price:</td><td>$${data.planPrice}</td></tr>` : ''}
              ${data.durationMonths ? `<tr><td style="padding: 8px 0; font-weight: bold;">Duration:</td><td>${data.durationMonths} months</td></tr>` : ''}
              ${data.startDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Start Date:</td><td>${data.startDate}</td></tr>` : ''}
              ${data.endDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">End Date:</td><td>${data.endDate}</td></tr>` : ''}
              ${data.amountPaid ? `<tr><td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td><td>$${data.amountPaid}</td></tr>` : ''}
              ${data.paymentStatus ? `<tr><td style="padding: 8px 0; font-weight: bold;">Payment Status:</td><td>${data.paymentStatus}</td></tr>` : ''}
              ${data.status ? `<tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td>${data.status}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📊 Impact Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Cancelled Invoices:</td><td>${data.cancelledInvoices || 0}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Deleted Transactions:</td><td>${data.deletedTransactions || 0}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">User Access:</td><td>Reverted to Guest</td></tr>
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">ℹ️ Note</p>
            <p style="margin: 10px 0;">The user has been notified of this cancellation via email. Related invoices have been marked as cancelled (not deleted) to maintain financial records.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Admin Panel</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
        </div>
      </div>
    `
  };
};

// Dispute email templates
const generateQuoteResponseAdminEmail = (data) => {
  return {
    subject: `📋 New Quote Response - GSN Network #${data.quoteId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Admin Panel</p>
          </div>
          
          <h2 style="color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 10px;">📋 New Quote Response Submitted</h2>
          
          <p>A company has submitted a new quote response that requires your attention.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">Quote Response Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Response ID:</td><td>#${data.quoteResponseId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Submitted On:</td><td>${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Quoted Price:</td><td style="font-size: 18px; color: #27ae60; font-weight: bold;">$${data.price}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Transit Time:</td><td>${data.transitTime}</td></tr>
            </table>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Name:</td><td>${data.userName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.userEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Type:</td><td>${data.userRole === 'business' ? 'Business User' : 'Regular User'}</td></tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Company Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Company Name:</td><td>${data.companyName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company Email:</td><td>${data.companyEmail}</td></tr>
              ${data.companyPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Company Phone:</td><td>${data.companyPhone}</td></tr>` : ''}
            </table>
          </div>
          
          ${data.originalQuote ? `
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Original Quote Request</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.originalQuote.shippingMode ? `<tr><td style="padding: 8px 0; font-weight: bold;">Shipping Mode:</td><td>${data.originalQuote.shippingMode}</td></tr>` : ''}
              ${data.originalQuote.departureCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">From:</td><td>${data.originalQuote.departureCountry}${data.originalQuote.departureState ? ', ' + data.originalQuote.departureState : ''}${data.originalQuote.departureCity ? ', ' + data.originalQuote.departureCity : ''}</td></tr>` : ''}
              ${data.originalQuote.arrivalCountry ? `<tr><td style="padding: 8px 0; font-weight: bold;">To:</td><td>${data.originalQuote.arrivalCountry}${data.originalQuote.arrivalState ? ', ' + data.originalQuote.arrivalState : ''}${data.originalQuote.arrivalCity ? ', ' + data.originalQuote.arrivalCity : ''}</td></tr>` : ''}
              ${data.originalQuote.productDescription ? `<tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td>${data.originalQuote.productDescription}</td></tr>` : ''}
              ${data.originalQuote.weight ? `<tr><td style="padding: 8px 0; font-weight: bold;">Weight:</td><td>${data.originalQuote.weight}</td></tr>` : ''}
              ${data.originalQuote.arrivalDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Arrival Date:</td><td>${data.originalQuote.arrivalDate}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          ${data.inclusions ? `
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Service Inclusions</h3>
            <p style="margin: 0;">${data.inclusions}</p>
          </div>
          ` : ''}
          
          ${data.terms ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Terms & Conditions</h3>
            <p style="margin: 0;">${data.terms}</p>
          </div>
          ` : ''}
          
          ${data.bankDetails ? `
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="color: #2c3e50; margin-top: 0;">💳 Payment Bank Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Bank Name:</td><td>${data.bankDetails.bankName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Account Holder Name:</td><td>${data.bankDetails.accountName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Account Number:</td><td>${data.bankDetails.accountNumber}</td></tr>
              ${data.bankDetails.branchName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Branch Name:</td><td>${data.bankDetails.branchName}</td></tr>` : ''}
              ${data.bankDetails.ibanNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">IBAN Number:</td><td>${data.bankDetails.ibanNumber}</td></tr>` : ''}
              ${data.bankDetails.swiftCode ? `<tr><td style="padding: 8px 0; font-weight: bold;">SWIFT Code:</td><td>${data.bankDetails.swiftCode}</td></tr>` : ''}
              ${data.bankDetails.routingNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">Routing Number:</td><td>${data.bankDetails.routingNumber}</td></tr>` : ''}
              ${data.bankDetails.paymentInstructions ? `<tr><td style="padding: 8px 0; font-weight: bold;">Payment Instructions:</td><td>${data.bankDetails.paymentInstructions}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">⚡ Action Required</p>
            <p style="margin: 10px 0;">Please review this quote response in the admin panel. The customer has been notified and can now review the company's offer.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Admin Panel</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateDisputeCreationAdminEmail = (data) => {
  return {
    subject: `🚨 New Dispute Filed - GSN Network #${data.disputeId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Admin Panel</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">🚨 New Dispute Filed</h2>
          
          <p>A new dispute has been filed in the system and requires admin attention.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Dispute Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Dispute ID:</td><td>#${data.disputeId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Title:</td><td>${data.title}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="text-transform: capitalize; color: ${data.priority === 'high' ? '#dc3545' : data.priority === 'medium' ? '#ffc107' : '#28a745'};">${data.priority}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="text-transform: capitalize;">${data.status}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed On:</td><td>${data.createdAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td>${data.reasonTitle}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Dispute Parties</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed By:</td><td>${data.creatorName} (${data.creatorEmail})</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Creator Role:</td><td style="text-transform: capitalize;">${data.creatorRole}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Against:</td><td>${data.targetName} (${data.targetEmail})</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Target Role:</td><td style="text-transform: capitalize;">${data.targetRole}</td></tr>
              ${data.quoteId ? `<tr><td style="padding: 8px 0; font-weight: bold;">Related Quote:</td><td>#${data.quoteId}</td></tr>` : ''}
              ${data.transactionId ? `<tr><td style="padding: 8px 0; font-weight: bold;">Related Transaction:</td><td>#${data.transactionId}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Dispute Description</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.description}</p>
          </div>
          
          ${data.attachments && data.attachments.length > 0 ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📎 Attachments</h3>
            <p style="margin: 0; color: #1976d2;">${data.attachments.length} attachment(s) provided with this dispute.</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">⚡ Action Required</p>
            <p style="margin: 10px 0;">Please review this dispute in the admin panel and take appropriate action. Both parties have been notified of the dispute filing.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Admin Panel</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateDisputeCreationCreatorEmail = (data) => {
  return {
    subject: `Dispute Filed Successfully - GSN Network #${data.disputeId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Dispute Filed Successfully</h2>
          
          <p>Dear ${data.creatorName},</p>
          <p>Your dispute has been successfully filed and is now under review. Here are the details:</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Dispute Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Dispute ID:</td><td>#${data.disputeId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Title:</td><td>${data.title}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed Against:</td><td>${data.targetName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="text-transform: capitalize;">${data.priority}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="text-transform: capitalize;">${data.status}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed On:</td><td>${data.createdAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td>${data.reasonTitle}</td></tr>
            </table>
          </div>
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Your Description</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6; font-style: italic;">"${data.description}"</p>
          </div>
          
          ${data.attachments && data.attachments.length > 0 ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📎 Attachments Submitted</h3>
            <p style="margin: 0; color: #1976d2;">${data.attachments.length} attachment(s) have been included with your dispute.</p>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">📋 What Happens Next?</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Our admin team will review your dispute</li>
              <li>The other party has been notified and may respond</li>
              <li>You'll receive email updates on any status changes</li>
              <li>You can track progress in your GSN Network dashboard</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">📞 Need Help?</p>
            <p style="margin: 10px 0;">If you have any questions about your dispute or need to provide additional information, please contact our support team.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">Thank you for using GSN Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

const generateDisputeCreationTargetEmail = (data) => {
  return {
    subject: `⚠️ Dispute Filed Against You - GSN Network #${data.disputeId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">⚠️ Dispute Filed Against You</h2>
          
          <p>Dear ${data.targetName},</p>
          <p>A dispute has been filed against you by ${data.creatorName}. Please review the details below and respond appropriately.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Dispute Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Dispute ID:</td><td>#${data.disputeId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Title:</td><td>${data.title}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed By:</td><td>${data.creatorName} (${data.creatorRole})</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="text-transform: capitalize; color: ${data.priority === 'high' ? '#dc3545' : data.priority === 'medium' ? '#ffc107' : '#28a745'};">${data.priority}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Filed On:</td><td>${data.createdAt}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td>${data.reasonTitle}</td></tr>
              ${data.quoteId ? `<tr><td style="padding: 8px 0; font-weight: bold;">Related Quote:</td><td>#${data.quoteId}</td></tr>` : ''}
              ${data.transactionId ? `<tr><td style="padding: 8px 0; font-weight: bold;">Related Transaction:</td><td>#${data.transactionId}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Dispute Details</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.description}</p>
          </div>
          
          ${data.attachments && data.attachments.length > 0 ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">📎 Supporting Evidence</h3>
            <p style="margin: 0; color: #1976d2;">${data.attachments.length} attachment(s) have been provided as evidence.</p>
          </div>
          ` : ''}
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">📋 Your Next Steps</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #28a745;">
              <li>Log in to your GSN Network dashboard to view full details</li>
              <li>Review the dispute and any supporting evidence</li>
              <li>Provide your response and any counter-evidence</li>
              <li>Work towards a resolution with the other party</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">⚖️ Fair Resolution</p>
            <p style="margin: 10px 0;">Our admin team will oversee this dispute to ensure a fair resolution for all parties. Please respond professionally and provide any relevant information.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment proof uploaded - notification to company
const generatePaymentProofCompanyEmail = (data) => {
  return {
    subject: `Payment Proof Uploaded - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">💳 Payment Proof Uploaded</h2>
          
          <p>Dear ${data.companyName},</p>
          <p>A customer has uploaded payment proof for their accepted quote. Please verify the payment and update the status accordingly.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c3e50; margin-top: 0;">Quote Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${data.customerName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.customerEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote Amount:</td><td>$${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Payment Date:</td><td>${data.paymentDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Upload Date:</td><td>${data.uploadDate}</td></tr>
            </table>
          </div>
          
          ${data.paymentNotes ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Customer Notes</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.paymentNotes}</p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #2c3e50; margin-top: 0;">🏦 Bank Details Used</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.bankName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Bank Name:</td><td>${data.bankName}</td></tr>` : ''}
              ${data.accountHolderName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Account Holder Name:</td><td>${data.accountHolderName}</td></tr>` : ''}
              ${data.accountNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">Account Number:</td><td>${data.accountNumber}</td></tr>` : ''}
              ${data.branchName ? `<tr><td style="padding: 8px 0; font-weight: bold;">Branch Name:</td><td>${data.branchName}</td></tr>` : ''}
              ${data.ibanNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">IBAN Number:</td><td>${data.ibanNumber}</td></tr>` : ''}
              ${data.swiftCode ? `<tr><td style="padding: 8px 0; font-weight: bold;">SWIFT Code:</td><td>${data.swiftCode}</td></tr>` : ''}
              ${data.routingNumber ? `<tr><td style="padding: 8px 0; font-weight: bold;">Routing Number:</td><td>${data.routingNumber}</td></tr>` : ''}
              ${data.paymentInstructions ? `<tr><td style="padding: 8px 0; font-weight: bold;">Payment Instructions:</td><td>${data.paymentInstructions}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⚡ Action Required</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Log in to your company dashboard to view the payment proof</li>
              <li>Verify the payment against your bank records</li>
              <li>Update the payment verification status</li>
              <li>Begin work once payment is confirmed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment proof uploaded - confirmation to user
const generatePaymentProofUserEmail = (data) => {
  return {
    subject: `Payment Proof Uploaded Successfully - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Payment Proof Uploaded Successfully</h2>
          
          <p>Dear ${data.customerName},</p>
          <p>Your payment proof has been successfully uploaded and sent to ${data.companyName} for verification.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c3e50; margin-top: 0;">Upload Confirmation</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td><td>$${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Payment Date:</td><td>${data.paymentDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Upload Date:</td><td>${data.uploadDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">File Name:</td><td>${data.fileName}</td></tr>
            </table>
          </div>
          
          ${data.paymentNotes ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Your Notes</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.paymentNotes}</p>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⏳ What Happens Next?</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>The company will verify your payment against their bank records</li>
              <li>You'll receive an email notification once payment is verified</li>
              <li>Work will begin once payment verification is complete</li>
              <li>You can track the status in your dashboard</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">💡 Important Notes</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #28a745;">
              <li>Keep your payment receipt for your records</li>
              <li>Payment verification typically takes 1-2 business days</li>
              <li>Contact the company directly if you have questions about verification</li>
              <li>You can view the status anytime in your GSN Network dashboard</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment verification approved - notification to user
const generatePaymentVerifiedUserEmail = (data) => {
  return {
    subject: `✅ Payment Verified - Work Starting Soon - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Payment Verified Successfully</h2>
          
          <p>Dear ${data.customerName},</p>
          <p>Great news! ${data.companyName} has verified your payment and work will begin shortly.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c3e50; margin-top: 0;">Verification Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td>${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Verified On:</td><td>${data.verificationDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="color: #28a745; font-weight: bold;">✅ Verified</td></tr>
            </table>
          </div>
          
          ${data.companyNotes ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Company Notes</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.companyNotes}</p>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">🚀 What Happens Next?</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>The company will begin work on your order</li>
              <li>You'll receive updates on the progress</li>
              <li>The company may contact you for additional details</li>
              <li>Track your order status in your GSN Network dashboard</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">📞 Contact Information</p>
            <p style="margin: 10px 0;">If you have any questions, you can contact ${data.companyName} directly at ${data.companyEmail}${data.companyPhone ? ` or ${data.companyPhone}` : ''}.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">Thank you for choosing GSN Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment verification rejected - notification to user
const generatePaymentRejectedUserEmail = (data) => {
  return {
    subject: `❌ Payment Verification Issue - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">❌ Payment Verification Issue</h2>
          
          <p>Dear ${data.customerName},</p>
          <p>We regret to inform you that ${data.companyName} was unable to verify your payment proof for Quote #${data.quoteId}.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Rejection Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td>${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Rejected On:</td><td>${data.verificationDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="color: #dc3545; font-weight: bold;">❌ Rejected</td></tr>
            </table>
          </div>
          
          ${data.rejectionReason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Reason for Rejection</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6; font-weight: bold;">${data.rejectionReason}</p>
          </div>
          ` : ''}
          
          ${data.paymentProofUrl ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #2c3e50; margin-top: 0;">📎 Your Submitted Payment Proof</h3>
            <p style="margin: 10px 0;">You can review your submitted payment proof here:</p>
            <a href="${data.paymentProofUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px;">View Payment Proof</a>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">🔄 Next Steps</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Review the rejection reason carefully</li>
              <li>Check your payment records and bank statements</li>
              <li>Contact ${data.companyName} directly to resolve the issue</li>
              <li>Upload a corrected payment proof if necessary</li>
              <li>Contact GSN Network support if you need assistance</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #28a745; font-weight: bold;">📞 Contact Information</p>
            <p style="margin: 10px 0;">
              <strong>Company:</strong> ${data.companyEmail}${data.companyPhone ? ` | ${data.companyPhone}` : ''}<br>
              <strong>GSN Support:</strong> Contact us through your dashboard
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment verification approved - notification to company
const generatePaymentVerifiedCompanyEmail = (data) => {
  return {
    subject: `✅ Payment Verified - Begin Work - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">✅ Payment Verification Confirmed</h2>
          
          <p>Dear ${data.companyName},</p>
          <p>You have successfully verified the payment for Quote #${data.quoteId}. You can now begin work on this order.</p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #2c3e50; margin-top: 0;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${data.customerName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.customerEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td>${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Verified On:</td><td>${data.verificationDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="color: #28a745; font-weight: bold;">✅ Payment Verified - Ready to Start</td></tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">🚀 Next Steps</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Begin work on the customer's order</li>
              <li>Contact the customer if you need additional information</li>
              <li>Provide regular updates on progress</li>
              <li>Update the order status in your company dashboard</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">📋 Important</p>
            <p style="margin: 10px 0;">The customer has been notified that their payment is verified and work is beginning. Please maintain professional communication and deliver quality service.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment verification rejected - notification to company
const generatePaymentRejectedCompanyEmail = (data) => {
  return {
    subject: `❌ Payment Rejected - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
          
          <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">❌ Payment Rejection Confirmed</h2>
          
          <p>Dear ${data.companyName},</p>
          <p>You have rejected the payment proof for Quote #${data.quoteId}. The customer and admin have been notified.</p>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #2c3e50; margin-top: 0;">Rejection Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${data.customerName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.customerEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td>${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Rejected On:</td><td>${data.verificationDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="color: #dc3545; font-weight: bold;">❌ Payment Rejected</td></tr>
            </table>
          </div>
          
          ${data.rejectionReason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 Your Rejection Reason</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6; font-weight: bold;">${data.rejectionReason}</p>
          </div>
          ` : ''}
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">📋 What Happens Next?</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #1976d2;">
              <li>The customer has been notified of the rejection and reason</li>
              <li>The customer may contact you to resolve the issue</li>
              <li>The customer may upload a corrected payment proof</li>
              <li>Work will not begin until payment is verified</li>
            </ul>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ Important</p>
            <p style="margin: 10px 0;">Please be available to assist the customer in resolving the payment verification issue. Professional communication is essential for maintaining good business relationships.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Gulf Star Network</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Connecting Global Trade</p>
          </div>
        </div>
      </div>
    `
  };
};

// Payment verification notification to admin
const generatePaymentVerificationAdminEmail = (data) => {
  return {
    subject: `${data.status === 'verified' ? '✅ Payment Verified' : '❌ Payment Rejected'} - Quote #${data.quoteId} - GSN Network`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">GSN Network</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network - Admin Panel</p>
          </div>
          
          <h2 style="color: ${data.status === 'verified' ? '#28a745' : '#dc3545'}; border-bottom: 2px solid ${data.status === 'verified' ? '#28a745' : '#dc3545'}; padding-bottom: 10px;">
            ${data.status === 'verified' ? '✅ Payment Verified' : '❌ Payment Rejected'}
          </h2>
          
          <p>A company has ${data.status === 'verified' ? 'verified' : 'rejected'} a customer's payment proof.</p>
          
          <div style="background: ${data.status === 'verified' ? '#e8f5e8' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.status === 'verified' ? '#28a745' : '#dc3545'};">
            <h3 style="color: #2c3e50; margin-top: 0;">Verification Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Quote ID:</td><td>#${data.quoteId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td>${data.customerName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Amount:</td><td>${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Action Date:</td><td>${data.verificationDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="color: ${data.status === 'verified' ? '#28a745' : '#dc3545'}; font-weight: bold;">${data.status === 'verified' ? '✅ Verified' : '❌ Rejected'}</td></tr>
            </table>
          </div>
          
          ${data.rejectionReason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #2c3e50; margin-top: 0;">📝 ${data.status === 'verified' ? 'Company Notes' : 'Rejection Reason'}</h3>
            <p style="margin: 0; color: #495057; line-height: 1.6;">${data.rejectionReason}</p>
          </div>
          ` : ''}
          
          ${data.paymentProofUrl ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #2c3e50; margin-top: 0;">📎 Payment Proof</h3>
            <p style="margin: 10px 0;">View the submitted payment proof:</p>
            <a href="${data.paymentProofUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px;">View Payment Proof</a>
          </div>
          ` : ''}
          
          <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Company Email:</td><td>${data.companyEmail}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Customer Email:</td><td>${data.customerEmail}</td></tr>
              ${data.companyPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Company Phone:</td><td>${data.companyPhone}</td></tr>` : ''}
              ${data.customerPhone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Customer Phone:</td><td>${data.customerPhone}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: bold;">📋 Status Update</p>
            <p style="margin: 10px 0;">
              ${data.status === 'verified' 
                ? 'Both parties have been notified. Work can now begin on this order.' 
                : 'Both parties have been notified of the rejection. The customer may need to provide corrected payment proof.'}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; margin: 0;">GSN Network - Admin Panel</p>
            <p style="color: #7f8c8d; margin: 5px 0;">Gulf Star Network</p>
          </div>
        </div>
      </div>
    `
  };
};

// Main email sending function
const sendQuoteEmail = async (emailType, data) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    
    // Generate appropriate email based on type
    switch (emailType) {
      case 'quoteRequestToUser':
        emailContent = generateQuoteRequestUserEmail(data);
        break;
      case 'quoteRequestToCompany':
        emailContent = generateQuoteRequestCompanyEmail(data);
        break;
      case 'quoteResponseToUser':
        emailContent = generateQuoteResponseEmail(data);
        break;
      case 'quoteResponseToAdmin':
        emailContent = generateQuoteResponseAdminEmail(data);
        break;
      case 'quoteAcceptanceToUser':
        emailContent = generateQuoteAcceptanceUserEmail(data);
        break;
      case 'quoteAcceptanceToCompany':
        emailContent = generateQuoteAcceptanceCompanyEmail(data);
        break;
      case 'subscriptionDeletionToUser':
        emailContent = generateSubscriptionDeletionUserEmail(data);
        break;
      case 'subscriptionDeletionToAdmin':
        emailContent = generateSubscriptionDeletionAdminEmail(data);
        break;
      case 'disputeCreationToAdmin':
        emailContent = generateDisputeCreationAdminEmail(data);
        break;
      case 'disputeCreationToCreator':
        emailContent = generateDisputeCreationCreatorEmail(data);
        break;
      case 'disputeCreationToTarget':
        emailContent = generateDisputeCreationTargetEmail(data);
        break;
      case 'paymentProofToCompany':
        emailContent = generatePaymentProofCompanyEmail(data);
        break;
      case 'paymentProofToUser':
        emailContent = generatePaymentProofUserEmail(data);
        break;
      case 'paymentVerifiedToUser':
        emailContent = generatePaymentVerifiedUserEmail(data);
        break;
      case 'paymentRejectedToUser':
        emailContent = generatePaymentRejectedUserEmail(data);
        break;
      case 'paymentVerifiedToCompany':
        emailContent = generatePaymentVerifiedCompanyEmail(data);
        break;
      case 'paymentRejectedToCompany':
        emailContent = generatePaymentRejectedCompanyEmail(data);
        break;
      case 'paymentVerificationToAdmin':
        emailContent = generatePaymentVerificationAdminEmail(data);
        break;
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }
    
    const mailOptions = {
      from: `"GSN Network (Gulf Star Network)" <${process.env.EMAIL_FROM}>`,
      to: data.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Quote email sent successfully: ${emailType} to ${data.recipientEmail}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`❌ Failed to send quote email (${emailType}):`, error);
    return { success: false, error: error.message };
  }
};

export { sendQuoteEmail };
export default { sendQuoteEmail };