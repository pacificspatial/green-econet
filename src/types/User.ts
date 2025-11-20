export type UserAttribute = {
  Name: string;
  Value: string;
};

export type User = {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId?: string;
    cfId?: string;
    attempts: number;
    totalRetryDelay: number;
  };
  Enabled: boolean;
  UserAttributes: UserAttribute[];
  UserCreateDate: Date;
  UserLastModifiedDate: Date;
  UserStatus: string;
  Username: string;
};

export type AuthEventPayload = {
  event: "signedIn" | "signedOut";
  data?: User;
  message?: string;
};

export interface UserRow {
  id: string;
  username: string;
  email: string;
  createdDate: string;
  isVerified: boolean;
}

export interface AttributeType {
  Name: string;
  Value: string;
}

export interface UserList {
  Username: string;
  Attributes: AttributeType[];
  UserCreateDate: string; // ISO 8601 date string
  UserLastModifiedDate: string; // ISO 8601 date string
  Enabled: boolean;
  UserStatus:
    | "UNCONFIRMED"
    | "CONFIRMED"
    | "ARCHIVED"
    | "COMPROMISED"
    | "UNKNOWN"
    | "RESET_REQUIRED"
    | "FORCE_CHANGE_PASSWORD";
}

export interface Attributes {
  enabled: "true" | "false";
}
