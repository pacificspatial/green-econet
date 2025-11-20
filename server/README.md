# Nature KY Server

## Description

Allows users to create projects where user can draw polygons and do modelling to view reports. The server supports the UI by providing the API routes. Database connection is also supported by the server.

## Table of Contents

  - [Folder Structure](#folder_structure)
    - [config](#config)
    - [controllers](#controllers)
    - [controllers](#controllers)
    - [helpers](#helpers)
    - [middlewares](#middlewares)
    - [models](#models)
    - [routes](#routes)
    - [utils](#utils)
    - [resources](#resources)
    - [Root Files](#root-files)
  - [Setup](#setup)
  - [Scripts](#scripts)
  - [Edit User Attributes in Cognito](#edit-user-attributes-in-cognito)

## Folder_Structure

The project follows a modular structure to keep the code organized and maintainable.

### config
Contains configuration files such as database configuration.

- `db.js`: Database connection configuration.
- `index.js`: General configuration settings.

### controllers
Contains controller files which handle the business logic.

- `userController.js`: Controller for user-related operations.
- `authController.js`: Controller for authentication-related operations.

### helpers
Contains helper functions used throughout the application.

- `errorHandler.js`: Handles and formats errors.
- `responseHandler.js`: Handles standardized API responses.

### middlewares
Contains middleware functions.

- `authMiddleware.js`: Middleware for authentication.
- `errorMiddleware.js`: Middleware for error handling.

### models
Contains Mongoose models.

- `userModel.js`: Mongoose model for users.
- `index.js`: Index file to export all models.

### routes
Contains route definitions.

- `userRoutes.js`: Routes for user-related endpoints.
- `authRoutes.js`: Routes for authentication-related endpoints.
- `index.js`: Aggregates all routes.

### utils
Contains utility functions and libraries.

- `jwtUtils.js`: Utility functions for JSON Web Token handling.
- `logger.js`: Logger utility.

### resources
Contains static resources like data files.

- `data.json`: Example data file.
- `maps/`: Directory for map-related data files.

### Root Files

- `.env`: Environment variables.
- `.gitignore`: Git ignore file.
- `app.js`: Main application setup.
- `server.js`: Entry point to start the server.
- `package.json`: Project dependencies and scripts.
- `package-lock.json`: Exact versions of dependencies.
- `README.md`: Project documentation.

## Setup

### Prerequisites

- Node.js and npm installed.

### Installation:
```bash
    cd server/
    npm install
```


### Edit User Attributes in Cognito

#### Editing User Attributes in AWS Cognito to Include Admin Property

This guide will walk you through the steps to edit an existing user's attributes to include an admin property in AWS Cognito.

#### Prerequisites
- An AWS account with necessary permissions to access and modify Cognito User Pools.
- Basic understanding of AWS Cognito User Pools.

#### Steps

1. **Sign into AWS Console**
   - Go to the [AWS Management Console](https://aws.amazon.com/console/).
   - Sign in with your AWS credentials.

2. **Navigate to Cognito User Pools**
   - In the AWS Management Console, search for and select **Cognito**.
   - Under **Cognito**, click on **Manage User Pools**.

3. **Select Your User Pool**
   - Find and select your user pool from the list. In this guide, we'll use `uenetapp` as an example.

4. **Select/Add User**
   - In the user pool, go to the **Users and groups** section.
   - Select the user you want to edit, or add a new user if necessary.

5. **Edit User Attributes**
   - With the user selected, go to **Attributes**.
   - Add or edit the attribute `custom:isAdmin`.
     - To add the attribute, click on **Add attribute**.
     - Set the key to `custom:isAdmin`.
     - Set the value to either `true` or `false` depending on the user's admin status.

6. **Save Changes**
   - Once you have added or edited the attribute, click on **Save changes** to update the user's attributes.

#### Example

Here is an example of setting a user's `custom:isAdmin` attribute to `true`:

1. Navigate to **Cognito -> userpools -> uenetapp**.
2. Select the user you want to edit.
3. Go to **Add attribute**.
4. Set the attribute:
   - **Key**: `custom:isAdmin`
   - **Value**: `true`
5. Save the changes.

#### Notes
- The `custom:isAdmin` attribute is a custom attribute and needs to be defined if not already available.
- Ensure you have proper permissions to edit user attributes in AWS Cognito.

By following these steps, you can successfully update a user's attributes to include an admin property in AWS Cognito.

---

For further assistance, refer to the [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/index.html) or contact AWS support.


