import { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import MenuInferior from './components/MenuInferior';
import Onboarding from './components/onBoarding';
import MapaPrincipal from './components/MapaPrincipal';
import FormularioVaga from './components/FormularioVaga';
import PainelEmpresa from './components/PainelEmpresa';
import VagasSalvas from './components/VagasSalvas';
import Perfil from './components/Perfil';
import DetalhesVaga from './components/DetalhesVaga';
import Register from './components/Register';
import Login from './components/Login';
import { Toaster } from 'react-hot-toast';
import { fetchAuth } from './utils/api';

export interface Vaga {
  id: number;
  titulo: string;
  descricao: string;
  empresa: string;
  tipo: string;
  bairro: string;
  latitude: number;
  longitude: number;
  link_contato: string;
  parceria: boolean;
}

const normalizarTexto = (texto: string) => {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function App() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('on-board');
  const [perfilUsuario, setPerfilUsuario] = useState(()=>{
    return localStorage.getItem('perfilUsuario') || '';
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>(['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarBairro, setMostrarBairro] = useState<string>('');
  const salvadorCentro: [number, number] = [-12.9714, -38.5014];
  const [termoBusca, setTermoBusca] = useState('');
  

  const alternarFiltro = (tipo: string) => {
    if (filtrosAtivos.includes(tipo)) {
      setFiltrosAtivos(filtrosAtivos.filter(t => t !== tipo));
    } else {
      setFiltrosAtivos([...filtrosAtivos, tipo]);
    }
  };

  const bairrosDisponiveis = Array.from(new Set(vagas.map(v => normalizarTexto(v.bairro)))).filter(Boolean).sort();

  const vagasFiltradas = vagas.filter(vaga => {
    const passaFiltroTipo = filtrosAtivos.includes(vaga.tipo);
    const passaFiltroBairro = mostrarBairro === '' || normalizarTexto(vaga.bairro) === mostrarBairro;

    const passaBusca = termoBusca === '' || vaga.titulo.toLowerCase().includes(termoBusca.toLowerCase());
    return passaFiltroTipo && passaFiltroBairro && passaBusca;
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const buscarVagas = useCallback( async (lat: number, lon: number, raio: number, empresa: string = '') => {
    try{
      if (perfilUsuario === 'empresa'){

        const token = localStorage.getItem('token')
        if(!token){
          setVagas([]);
          return
        }

        const response = await fetchAuth(`${API_URL}/api/vaga/minhas`, {
          method: 'GET'
        });

        if (response.ok){
          const dados = await response.json();
          setVagas(dados || []);
        }else{
          setVagas([]);
        }
      }else{
        let url =`${API_URL}/api/vaga?`;
        if(empresa){
          url += `empresa=${encodeURIComponent(empresa)}`
        }else{
          url += `lat=${lat}&lon=${lon}&raio=${raio}`;
        }

        const response = await fetch(url)
        const dados = await response.json();

        if(dados.erro){
          setVagas([]);
        }else if(Array.isArray(dados)){
          setVagas(dados);
        }
      }
    } catch(erro){
      console.error("erro ao buscar vagas: ", erro)
      setVagas([]);
    }
  }, [perfilUsuario, API_URL]);

  

  useEffect(() => {
    buscarVagas(salvadorCentro[0], salvadorCentro[1], 5000);
  }, [buscarVagas]);

  return (
      
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {abaAtiva === 'on-board' && (
        <Onboarding 
          setPerfilUsuario={setPerfilUsuario}
          setAbaAtiva={setAbaAtiva}
        />
      )}

      {abaAtiva === 'mapa' && (
        <>
          <MapaPrincipal 
      
            buscarVagas={buscarVagas}
            abaAtiva={abaAtiva}
            salvadorCentro={salvadorCentro}
            vagasFiltradas={vagasFiltradas}
            setVagaSelecionada = {setVagaSelecionada}
            mostrarFiltros = {mostrarFiltros}
            filtrosAtivos = {filtrosAtivos}
            alternarFiltro = {alternarFiltro}
            bairrosDisponiveis = {bairrosDisponiveis}
            mostrarBairro = {mostrarBairro}
            setMostrarBairro = {setMostrarBairro}
            setMostrarFiltros = {setMostrarFiltros}
            termoBusca = {termoBusca}
            setTermoBusca = {setTermoBusca}
          />
          <MenuInferior
            perfilUsuario={perfilUsuario}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            setMostrarFiltros={setMostrarFiltros}
          />
        </>

      )}
      

      {abaAtiva === 'login' && (
        <Login
          setAbaAtiva={setAbaAtiva}
          setPerfilUsuario={setPerfilUsuario}
        />
      )}


      {abaAtiva === 'register' && (
        <Register 
          setAbaAtiva={setAbaAtiva}
        />
      )}

      {abaAtiva === 'nova-vaga' && (
          <>
            <FormularioVaga 
              adicionarVagaNaLista={(novaVaga) => setVagas((estadoAnterior) => [...estadoAnterior, novaVaga])}
              setAbaAtiva={setAbaAtiva}  
            />
            <MenuInferior
              perfilUsuario={perfilUsuario}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              setMostrarFiltros={setMostrarFiltros}
            />
          </>
      )}

      {abaAtiva === 'painel-empresa' && (
        <>
          <PainelEmpresa />
          <MenuInferior
            perfilUsuario={perfilUsuario}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            setMostrarFiltros={setMostrarFiltros}
          />
        </>
      )}


      {abaAtiva === 'salvas' && (
        <>
          <VagasSalvas />
          <MenuInferior
            perfilUsuario={perfilUsuario}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            setMostrarFiltros={setMostrarFiltros}
          />

        </>
        
      )}

      {abaAtiva === 'perfil' && (
        <>
          <Perfil 
            perfilUsuario={perfilUsuario} 
            setPerfilUsuario={setPerfilUsuario}
            setAbaAtiva={setAbaAtiva}
          />
          <MenuInferior
            perfilUsuario={perfilUsuario}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            setMostrarFiltros={setMostrarFiltros}
          />
        </>
      )}

      {vagaSelecionada && abaAtiva === 'mapa' && (
        <>
          <DetalhesVaga 
            setVagaSelecionada={setVagaSelecionada}
            vagaSelecionada={vagaSelecionada}
            onFiltrarEmpresa={(nomeEmpresa) => {
              buscarVagas(salvadorCentro[0], salvadorCentro[1], 5000, nomeEmpresa);
              setVagaSelecionada(null); // Fecha o card para mostrar as vagas filtradas no mapa
            }}
          />
          <MenuInferior
            perfilUsuario={perfilUsuario}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            setMostrarFiltros={setMostrarFiltros}
          />
        </>
      )}
    </>
  );
}