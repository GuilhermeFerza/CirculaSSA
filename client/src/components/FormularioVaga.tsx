import React, { useState } from 'react'
import { CheckCircle, MapPin, Send } from 'lucide-react'
import { Vaga } from '../App';
import toast from 'react-hot-toast';
import { fetchAuth } from '../utils/api';

interface FormularioVagaProps{
    adicionarVagaNaLista: (vaga: Vaga) => void;
    setAbaAtiva: (aba: string) => void;
}


export default function FormularioVaga({ adicionarVagaNaLista, setAbaAtiva }: FormularioVagaProps){
    
    const [titulo, setTitulo] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('CLT');
    const [bairro, setBairro] = useState('');
    const [linkContato, setLinkContato] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enderecoBusca, setEnderecoBusca] = useState('');
    const [buscandoEndereco, setBuscandoEndereco]=useState(false);



    const[localizacao, setLocalizacao] = useState<{lat: number, lon: number} | null>(null)
    const [buscandoGps, setBuscandoGps] = useState(false);

    const capturarLocalizacao = (e: React.MouseEvent) => {
        e.preventDefault();
        setBuscandoGps(true);


        if("geolocation" in navigator){
            navigator.geolocation.getCurrentPosition(
                (posicao) => {
                    setLocalizacao({
                        lat: posicao.coords.latitude,
                        lon: posicao.coords.longitude
                    });
                    setBuscandoGps(false)
                },
                (erro) => {
                    console.error("Erro no GPS:", erro);
                    toast.error("Não conseguimos acessar sua localização. Verifique as permissões do navegador.");
                    setBuscandoGps(false);
                }
            );
        }else{
            toast.error("Seu navegador não suporta GPS.")
            setBuscandoGps(false)
        }
    };

    const buscarCoordenadasPorEndereco = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!enderecoBusca){
            toast.error("Digite um endereço para buscar.")
            return;
        }

        setBuscandoEndereco(true);
        try{
            const query = encodeURIComponent(`${enderecoBusca}, Salvador, Bahia, Brasil`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
            const data = await response.json();

            if(data && data.lenght > 0){
                setLocalizacao({
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                });
                toast.success("Localização encontrada com sucesso no mapa!");
            }else{
                toast.error("Endereço não encontrado. Tente colocar a rua e o bairro.")
            }
        }catch(error){
            console.error("Erro na busca de endereço:", error);
            toast.error("Falha ao buscar o endereço.");
        }
        setBuscandoEndereco(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if(!localizacao){
            toast.error("Por favor, capture a localizacao da vaga primeiro!");
            return;
        }

        const dadosVagas = {
            titulo,
            empresa,
            descricao,
            tipo,
            bairro,
            latitude: localizacao.lat,
            longitude: localizacao.lon,
            link_contato: linkContato
        };

        console.log("Vaga pronta para ir no backend:", dadosVagas)
        toast.success("Vaga registrada com sucesso!");
        
        const token = localStorage.getItem('token')

        setIsSubmitting(true);

        try{
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetchAuth(`${API_URL}/api/vaga`, {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dadosVagas),
            });

            if (response.ok){
                const novaVagaDoServidor = await response.json();
                adicionarVagaNaLista(novaVagaDoServidor);
                setAbaAtiva('painel-empresa');
            }else{
                toast.error("Erro ao enviar a vaga para o servidor.")
            }
        } catch(error){
            console.error("Erro na requisicao: ", error);
            toast.error("Não foi possível conectar ao servidor.");
        }
        setIsSubmitting(false);  
    };
    return(
        <div className='container-formulario'>
            <h2>Cadastrar Nova Vaga</h2>
            <p className='subtitulo'>Preencha os dados para a oportunidade</p>

            <form onSubmit={handleSubmit} className='form-vaga'>
                <div className='grupo-input'>
                    <label>Título da Vaga</label>
                    <input type='text' placeholder='Ex: Desenvolvedor Front-End' value={titulo} onChange={(e) => setTitulo(e.target.value)} required/>
                </div>

                <div className='grupo-input'>
                    <label>Nome da Empresa</label>
                    <input type='text' placeholder='Ex: Tech Solutions' value={empresa} onChange={(e) => setEmpresa(e.target.value)}  required/>
                </div>

                <div className='grupo-input'>
                    <label>Tipo de Contrato</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="CLT">CLT</option>
                        <option value="Estágio">Estágio</option>
                        <option value="Jovem Aprendiz">Jovem Aprendiz</option>
                        <option value="Mutirão">Mutirão</option>
                    </select>
                </div>

                <div className='grupo-input'>
                    <label>Bairro (Sede ou Local de Trabalho)</label>
                    <input type='text' placeholder='Ex: Caminho das Árvores' value={bairro} onChange={(e) => setBairro(e.target.value)} required/>
                </div>

                <div className='grupo-input'>
                    <label>Descrição e Requisitos</label>
                    <textarea rows={4} placeholder='O que o candidator precisa saber?' value={descricao} onChange={(e)=> setDescricao(e.target.value)} required/>
                </div>

                <div className='cartao-gps'>
                    <h3>Localização no Mapa</h3>
                    <p>Digite o endereço ou local de trabalho para marcarmos no mapa.</p>
                    
                    <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '12px' }}>
                        <input 
                            type="text" 
                            placeholder="Ex: Shopping da Bahia..." 
                            value={enderecoBusca}
                            onChange={(e) => setEnderecoBusca(e.target.value)}
                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #bae6fd' }}
                        />
                        <button 
                            onClick={buscarCoordenadasPorEndereco}
                            style={{ padding: '12px 20px', borderRadius: '10px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', cursor: 'pointer' }}
                            disabled={buscandoEndereco}
                        >
                            {buscandoEndereco ? "Buscando..." : "Buscar"}
                        </button>
                    </div>

                    <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '0.8rem', color: '#0369a1' }}>OU</p>

                    <button 
                        className={`btn-gps ${localizacao ? 'sucesso' : ''}`}
                        onClick={capturarLocalizacao}
                    >
                        {buscandoGps ? (
                            "Buscando satélites..."
                        ) : localizacao ? (
                            <><CheckCircle size={20}/>Localização Salva!</>
                        ) : (
                            <><MapPin size={20}/> Usar meu GPS atual</>
                        )}
                    </button>
                </div>

                <div className="grupo-input">
                    <label>Link ou E-mail para Contato</label>
                    <input 
                        type="text" 
                        placeholder="ex: https://gupy.io/... ou rh@suaempresa.com" 
                        value={linkContato} 
                        onChange={(e) => setLinkContato(e.target.value)} 
                        required 
                    />
                </div>

                    <button type='submit' className='btn-submit'>
                        <Send size={20} /> {isSubmitting ? "Enviando..." : "Anunciar Vaga"}
                    </button>
            </form>
        </div>
    );
}