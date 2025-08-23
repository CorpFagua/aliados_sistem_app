import { createContext,useState ,useEffect,useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";

import { supabase } from "../lib/supabase";

type AuthData ={
    loading:boolean;
    session:Session | null;
}

const AuthContext = createContext<AuthData>({
    loading: true,
    session: null
});

interface AuthProviderProps{
    children:React.ReactNode;
}

export default function AuthProvider(props : AuthProviderProps) {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            const { error ,data } = await supabase.auth.getSession();

            if (error) {
                console.error("Error fetching session:", error.message);
            }

            if(data.session){
                setSession(data.session);
            }else{
                router.replace("/login");
            }
            setLoading(false)
          
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
            setSession(session);
            setLoading(false);

            if (session) {
                router.replace("/home");
            } else {
                router.replace("/login");
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };

    }, []);

    return(
        <AuthContext.Provider value={{ loading, session }}>
            {props.children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => {
    return useContext(AuthContext);
};
