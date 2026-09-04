export type NotificationParams = {
  [key: string]: string | string[] | number;
};

export type NotificationAttachment = {
  content: string;
  mimeType: string;
  filename: string;
};

export interface NotifyMessageContent {
  params?: NotificationParams;
  attachments?: NotificationAttachment[];
}

export interface NotifyAPIMessagePayload {
  params?: NotificationParams;
  email: {
    recipients: {
      to: string[];
    };
    content: {
      templateId: string;
    };
    attachments?: NotificationAttachment[];
  };
}

export interface NotifyAPIErrorResponse {
  statusCode: number;
  message: string;
  errors: string[];
  fieldErrors: {
    [key: string]: string;
  };
}
