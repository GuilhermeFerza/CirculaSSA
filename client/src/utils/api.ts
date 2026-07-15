import toast from "react-hot-toast";

export const fetchAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/type',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {...options, headers});

    if(response.status === 401){
        localStorage.removeItem('token');
        localStorage.removeItem('perfilUsuario');
        toast.error("Sessão expirada. Faça login novamente.");
        window.location.reload();
    }
    return response;
}