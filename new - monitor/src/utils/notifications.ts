// Gerenciador de notificações do navegador
export class NotificationManager {
  private static instance: NotificationManager;
  private hasPermission: boolean = false;

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private checkPermission(): void {
    if (!("Notification" in window)) {
      console.warn("Este navegador não suporta notificações");
      return;
    }
    this.hasPermission = Notification.permission === "granted";
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Este navegador não suporta notificações");
      return false;
    }

    if (Notification.permission === "granted") {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === "granted";
      return this.hasPermission;
    }

    return false;
  }

  getPermissionStatus(): NotificationPermission {
    if (!("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  sendNotification(title: string, options?: NotificationOptions): void {
    if (!this.hasPermission) {
      console.warn("Permissão para notificações não concedida");
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: true,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto fechar após 10 segundos se não for crítico
      if (!options?.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  }

  sendCriticalAlert(alert: {
    title: string;
    description: string;
    queue?: string;
    value?: number;
  }): void {
    const body = `${alert.description}${
      alert.queue ? `\n\nFila: ${alert.queue}` : ""
    }${alert.value !== undefined ? `\nValor: ${alert.value}%` : ""}`;

    this.sendNotification(`🚨 ${alert.title}`, {
      body,
      tag: `critical-${alert.queue || "general"}`,
      requireInteraction: true,
      silent: false,
    });
  }

  sendWarningAlert(alert: {
    title: string;
    description: string;
    queue?: string;
  }): void {
    this.sendNotification(`⚠️ ${alert.title}`, {
      body: alert.description,
      tag: `warning-${alert.queue || "general"}`,
      requireInteraction: false,
      silent: true,
    });
  }

  sendInfoNotification(title: string, message: string): void {
    this.sendNotification(`ℹ️ ${title}`, {
      body: message,
      requireInteraction: false,
      silent: true,
    });
  }
}

// Exportar instância singleton
export const notificationManager = NotificationManager.getInstance();
