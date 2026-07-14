import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'lucide-react';
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

export interface Vaga {
  id: number;
  titulo: string;
  descricao: string;
  empresa: string;
  tipo: string;
  bairro: string;
  latitude: number;
  longitude: number;
}

export default function App() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [abaAtiva, setAbaAtiva] = useState('login');
  const [perfilUsuario, setPerfilUsuario] = useState(()=>{
    return localStorage.getItem('perfilUsuario') || '';
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>(['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarBairro, setMostrarBairro] = useState<string>('');
  const salvadorCentro: [number, number] = [-12.9714, -38.5014];


  const sairDoPerfil = () => {
    localStorage.removeItem('perfilUsuario');
    setPerfilUsuario('');
    setAbaAtiva('mapa');
  }

  const alternarFiltro = (tipo: string) => {
    if (filtrosAtivos.includes(tipo)) {
      setFiltrosAtivos(filtrosAtivos.filter(t => t !== tipo));
    } else {
      setFiltrosAtivos([...filtrosAtivos, tipo]);
    }
  };

  const bairrosDisponiveis = Array.from(new Set(vagas.map(v => v.bairro))).filter(Boolean).sort();

  const vagasFiltradas = vagas.filter(vaga => {
    const passaFiltroTipo = filtrosAtivos.includes(vaga.tipo);
    const passaFiltroBairro = mostrarBairro === '' || vaga.bairro === mostrarBairro;
    return passaFiltroTipo && passaFiltroBairro;
  });


  const buscarVagas = useCallback((lat: number, lon: number, raio: number) => {
    fetch(`http://localhost:8080/api/vaga?lat=${lat}&lon=${lon}&raio=${raio}`)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (dados.erro) {
          setVagas([]);
        } else if (Array.isArray(dados)) {
          setVagas(dados);
        }
      })
      .catch((erro) => console.error("Erro ao buscar vagas:", erro));
  }, []);

  

  useEffect(() => {
    buscarVagas(salvadorCentro[0], salvadorCentro[1], 5000);
  }, [buscarVagas]);

  return (
    <>
    <Onboarding 
      perfilUsuario={perfilUsuario}
      setPerfilUsuario={setPerfilUsuario}
      setAbaAtiva={setAbaAtiva}
    />
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
        <VagasSalvas vagas={vagas} />
      )}

      {abaAtiva === 'perfil' && (
        <>
          <Perfil 
            perfilUsuario={perfilUsuario} 
            sairDoPerfil={sairDoPerfil}
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