import { body } from "express-validator";

const projectValidationRules = {
  createProject: [
    // Validate project name
    body("name")
      .notEmpty()
      .withMessage("Project name is required")
      .trim()
      .custom((value) => {
        // Check if name contains only spaces
        if (value.replace(/\s/g, "").length === 0) {
          throw new Error("Project name cannot contain only spaces");
        }
        return true;
      }),
  ],

  updateProject: [
    // Validate project name (optional but should not contain only spaces)
    body("name")
      .optional()
      .trim()
      .custom((value) => {
        if (value && value.replace(/\s/g, "").length === 0) {
          throw new Error("Project name cannot contain only spaces");
        }
        return true;
      }),
  ],
};

export default projectValidationRules;
