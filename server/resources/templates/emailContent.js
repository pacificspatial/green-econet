const emailContent = {
  subject: "🚀 Project Creation Alert", // Add a visual element in the subject
  emailBody: `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">New Project Created! 🎉</h2>
      <p style="font-size: 16px;">
        A new project has been successfully created by <strong>{{username}}</strong>.
      </p>
      <p style="font-size: 16px;">
        <strong>Project Name:</strong> {{name}}
      </p>
      <hr style="border: none; border-top: 1px solid #ccc;" />
      <footer style="font-size: 12px; color: #777;">
        This is an automated message. If you have any questions, feel free to reply to this email.
      </footer>
    </div>
  `,
  contentType: 'text/html' 
};
  
  module.exports = {
    emailContent
  };
  