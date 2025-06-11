import Stripe from "stripe";

export const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY ?? "",
    {
        apiVersion: '2025-05-28.basil',
        appInfo: {
            name: "Spotify Clone Video",
            version: '0.1.0'
        }
    }
);

// Инициализация серверного экземпляра Stripe клиента (создание подписок, работа с вебхуками, управление продуктами), использует секретный ключ

// Используется для:
// - stripe.subscriptions.retrieve()
// - stripe.customers.update()
// - stripe.customers.create()