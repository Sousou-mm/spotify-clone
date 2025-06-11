"use client";

import {useState} from "react";
import {createClientComponentClient} from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

import {Database} from "@/types_db";



interface SupabaseProviderProps{
    children: React.ReactNode;
};

const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
    children
}) => {
    const [supabaseClient] = useState(() =>
        createClientComponentClient<Database>()
    );

    return (
        <SessionContextProvider supabaseClient={supabaseClient}>
            {children}
        </SessionContextProvider>
    )
}

export default SupabaseProvider;

// - Когда компонент SupabaseProvider монтируется, он создаёт клиент Supabase один раз и сохраняет его в состоянии.
// - Затем он оборачивает своих детей (children) в SessionContextProvider, который предоставляет контекст сессии Supabase.
// - Это позволяет всем дочерним компонентам работать с аутентификацией и базой данных через Supabase, используя общий клиент и контекст.