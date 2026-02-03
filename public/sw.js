/**
 * 🌐 Service Worker para manejar notificaciones push en web
 * Este archivo debe estar en la raíz del proyecto público (public/sw.js)
 */

// Event listener para notificaciones push recibidas
self.addEventListener("push", function (event) {
  console.log("[SW] ✅ Push notification received");
  console.log("[SW] Event:", event);

  // Datos por defecto
  let notificationData = {
    title: "Notificación",
    body: "Tienes un nuevo mensaje",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
  };

  // Intentar extraer datos del payload
  if (event.data) {
    console.log("[SW] Data presente en evento");
    try {
      const payloadData = event.data.json();
      console.log("[SW] Payload JSON parseado:", payloadData);
      
      // Validar cada campo del payload
      if (payloadData.title) {
        console.log("[SW] ✓ title encontrado:", payloadData.title);
        notificationData.title = payloadData.title;
      }
      if (payloadData.body) {
        console.log("[SW] ✓ body encontrado:", payloadData.body);
        notificationData.body = payloadData.body;
      }
      if (payloadData.icon) {
        console.log("[SW] ✓ icon encontrado:", payloadData.icon);
        notificationData.icon = payloadData.icon;
      }
      if (payloadData.badge) {
        console.log("[SW] ✓ badge encontrado:", payloadData.badge);
        notificationData.badge = payloadData.badge;
      }
      if (payloadData.data) {
        console.log("[SW] ✓ data encontrado:", payloadData.data);
        notificationData.data = payloadData.data;
      }
      
      console.log("[SW] Datos de notificación finales:", notificationData);
    } catch (e) {
      console.error("[SW] ❌ Error al parsear datos de push:", e);
      console.log("[SW] Usando datos por defecto");
    }
  } else {
    console.warn("[SW] ⚠️  No hay data en el evento push");
  }

  console.log("[SW] 📢 Mostrando notificación con:", {
    title: notificationData.title,
    body: notificationData.body,
    icon: notificationData.icon,
  });

  // ✅ CREAR TAG ÚNICO PARA CADA NOTIFICACIÓN
  // Esto evita que se sobrescriban
  const uniqueTag = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log("[SW] 🏷️  Tag único generado:", uniqueTag);

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: uniqueTag,
        data: notificationData.data,
      })
      .then(() => {
        console.log("[SW] ✅ Notificación mostrada exitosamente con tag:", uniqueTag);
      })
      .catch((err) => {
        console.error("[SW] ❌ Error mostrando notificación:", err);
      })
  );
});

// Event listener para clicks en notificaciones
self.addEventListener("notificationclick", function (event) {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  // Obtener datos de la notificación
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Buscar si ya hay una ventana abierta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Event listener para cerrar notificaciones
self.addEventListener("notificationclose", function (event) {
  console.log("[SW] Notification closed:", event);
});

// Actualizar Service Worker
self.addEventListener("activate", function (event) {
  console.log("[SW] Service Worker activated");
  event.waitUntil(clients.claim());
});

// Manejar mensajes del cliente
self.addEventListener("message", function (event) {
  console.log("[SW] Message from client:", event.data);
});
