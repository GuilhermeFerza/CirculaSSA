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
  const [abaAtiva, setAbaAtiva] = useState('mapa');
  const [perfilUsuario, setPerfilUsuario] = useState(()=>{
    return localStorage.getItem('perfilUsuario') || '';
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<string[]>(['Estágio', 'CLT', 'Jovem Aprendiz', 'Mutirão']);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarBairro, setMostrarBairro] = useState<string>('');
  const timerRef = useRef<number | null>(null);
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

  const favoritarVaga = (id: number) => {
    const salvos = JSON.parse(localStorage.getItem('vagasSalvas') || '[]')
    if(!salvos.includes(id)){
      salvos.push(id);
      localStorage.setItem('vagasSalvas', JSON.stringify(salvos));
      alert('Vaga salva com sucesso nas suas listas!');
    }else{
      alert('Você já salvou esta vaga antes!')
    }
  }

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

      {abaAtiva === 'nova-vaga' && (
        <FormularioVaga />
      )}

      {abaAtiva === 'painel-empresa' && (
        <PainelEmpresa vagas={vagas} />
      )}


      {abaAtiva === 'salvas' && (
        <VagasSalvas vagas={vagas} />
      )}

      {abaAtiva === 'perfil' && (
        <div className="container-perfil">
          <Perfil 
            perfilUsuario={perfilUsuario} 
            sairDoPerfil={sairDoPerfil}
          />
        </div>
      )}

      {vagaSelecionada && abaAtiva === 'mapa' && (
        <>
          <div className="overlay" onClick={() => setVagaSelecionada(null)}></div>
          <div className="bottom-sheet">
            <button className="botao-fechar" onClick={() => setVagaSelecionada(null)}>&times;</button>
            <h2>{vagaSelecionada.titulo}</h2>
            <span className="tag-tipo">{vagaSelecionada.tipo}</span>
            <p className="info-empresa">
              <strong>Empresa:</strong> {vagaSelecionada.empresa} &bull; <strong>Local:</strong> {vagaSelecionada.bairro}
            </p>
            <p className="descricao-vaga">{vagaSelecionada.descricao}</p>
            <button
              className='btn-submit'
              style={{width: '100%', marginTop: '20px'}}
              onClick={()=> favoritarVaga(vagaSelecionada.id)}
            >
              Salvar Vaga
            </button>
          </div>
        </>
      )}

      <MenuInferior
        perfilUsuario={perfilUsuario}
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        setMostrarFiltros={setMostrarFiltros}
      />
    </>
  );
}