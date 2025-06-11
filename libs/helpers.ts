import { Price } from "@/types";

export const getURL = () => {
    let url = 
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.NEXT_PUBLIC_VERCEL_URL ??
        "http://localhost:3000/";

    url = url.includes('http') ? url :`https://${url}`; // добавляем протокол в случае отсутствия
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`; // добавляем слэш если он отсутствует

    return url;
};// определяет базовый URL для вебхуков Stripe и перенаправлений после платежа

export const postData = async ({
    url, // куда мы отправляем данные
    data
}:{
    url: string;
    data?: { price:Price };
}) => {
    console.log("POST REQUEST:", url, data);

    const res: Response = await fetch(url, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json"}),
        credentials: "same-origin",
        body: JSON.stringify(data) // сериализация объекта data в JSON-строку 
    }); // отправка данных от клиента к серверу

    if (!res.ok) {
        console.log("Error in POST", {url, data, res})

        throw new Error(res.statusText);
    }

    return res.json(); 
}; // (вызвается при оформлении подписки) обёртка для POST зпароса: создание ссесии оплаты

export const toDateTime = (secs: number) => {
    var t = new Date("1970-01-01T00:30:00Z")
    t.setSeconds(secs);
    return t;
};