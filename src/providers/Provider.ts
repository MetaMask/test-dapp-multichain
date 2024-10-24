export type Provider = {
  connect(extensionId?: string): void;
  disconnect(): void;
  request(params: { method: string; params: any }): Promise<any>;
  onNotification(callback: (notification: any) => void): void;
  removeNotificationListener(callback: (notification: any) => void): void;
  removeAllNotificationListeners(): void;
};
