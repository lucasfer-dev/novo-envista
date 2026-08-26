import { Competition, Course, Project, Team, User } from '@/types'

export const participant: User = {
  id:'u1', username:'lucasfer', name:'Lucas Ferreira', role:'participant',
  bio:'Desenvolvedor e criador interessado em tecnologia, educação e projetos com impacto.',
  school:'Colégio Horizonte', city:'Rio de Janeiro', state:'RJ',
  skills:['Programação','Robótica','IA','Gestão de projetos']
}

export const adminUser: User = {
 id:'admin-1',username:'admin',name:'Admin Envista',role:'admin',bio:'Administração da plataforma Envista.',city:'Rio de Janeiro',state:'RJ'
}
export const investor: User = {
  id:'i1', username:'marinaalves', name:'Marina Alves', role:'investor', organization:'Horizonte Ventures', jobTitle:'Investment Associate', city:'São Paulo', state:'SP',
  organizationType:'Venture capital', stages:['Ideação','MVP','Tração'],
  bio:'Busco equipes jovens resolvendo problemas reais com tecnologia e impacto mensurável.',
  interests:['EdTech','Sustentabilidade','IA','Impacto social']
}
export const people: User[] = [participant,
 {id:'u2',username:'anasouza',name:'Ana Souza',role:'participant',skills:['Gestão','Pesquisa'],school:'SESI',city:'Rio de Janeiro'},
 {id:'u3',username:'bealima',name:'Beatriz Lima',role:'participant',skills:['Design','UX'],school:'SENAI',city:'Niterói'},
 {id:'u4',username:'rafaelcosta',name:'Rafael Costa',role:'participant',skills:['Eletrônica','Robótica'],school:'CEFET',city:'Rio de Janeiro'},
 {id:'u5',username:'juliacampos',name:'Júlia Campos',role:'participant',skills:['IA','Python'],school:'Pedro II',city:'Rio de Janeiro'},
 {id:'u6',username:'caiofreitas',name:'Caio Freitas',role:'participant',skills:['Marketing','Comunicação'],school:'SESI',city:'Duque de Caxias'},
 {id:'u7',username:'laisrocha',name:'Laís Rocha',role:'participant',skills:['Pesquisa','Biologia'],school:'FAETEC',city:'Queimados'},
 {id:'u8',username:'pedromatos',name:'Pedro Matos',role:'participant',skills:['Arduino','IoT'],school:'SENAI',city:'Nova Iguaçu'},
 {id:'u9',username:'sofiapaz',name:'Sofia Paz',role:'participant',skills:['Design','Apresentação'],school:'SESI',city:'São João de Meriti'},
 {id:'u10',username:'gabrieleal',name:'Gabriel Leal',role:'participant',skills:['JavaScript','Web'],school:'CEFET',city:'Rio de Janeiro'}
]

export const teams: Team[] = [
 {id:'t1',slug:'atlas',name:'Atlas',description:'Tecnologia aplicada a sustentabilidade em ambientes educacionais.',members:[{userId:'u2',role:'Líder de Projeto',joinedAt:'2026-02-10'},{userId:'u1',role:'Desenvolvedor',joinedAt:'2026-03-04'},{userId:'u3',role:'Designer',joinedAt:'2026-03-08'},{userId:'u4',role:'Pesquisa',joinedAt:'2026-03-10'}],category:'Sustentabilidade',city:'Rio de Janeiro',institution:'SESI SENAI',tags:['IoT','Sustentabilidade','Educação'],projects:['p1']},
 {id:'t2',slug:'orion',name:'Orion',description:'Soluções digitais para ampliar acesso a oportunidades educacionais.',members:[{userId:'u1',role:'Líder de Projeto',joinedAt:'2026-01-12'},{userId:'u5',role:'IA',joinedAt:'2026-02-01'},{userId:'u6',role:'Comunicação',joinedAt:'2026-02-18'}],category:'Educação',city:'Rio de Janeiro',institution:'Colégio Horizonte',tags:['EdTech','IA','Web'],projects:['p4']},
 {id:'t3',slug:'nova',name:'Nova',description:'Educação e inteligência artificial para apoiar aprendizagem personalizada.',members:[{userId:'u5',role:'Líder',joinedAt:'2026-02-01'},{userId:'u9',role:'Designer',joinedAt:'2026-02-03'}],category:'Educação',city:'Niterói',institution:'Rede pública',tags:['IA','Educação'],projects:['p3']},
 {id:'t4',slug:'orbit',name:'Orbit',description:'Equipe de robótica competitiva e automação.',members:[{userId:'u4',role:'Capitão',joinedAt:'2026-01-20'},{userId:'u8',role:'Eletrônica',joinedAt:'2026-01-21'}],category:'Robótica',city:'Nova Iguaçu',institution:'SENAI',tags:['Robótica','Arduino'],projects:[]},
 {id:'t5',slug:'lumina',name:'Lumina',description:'Tecnologia assistiva e acessibilidade.',members:[{userId:'u7',role:'Pesquisa',joinedAt:'2026-03-02'},{userId:'u10',role:'Desenvolvedor',joinedAt:'2026-03-02'}],category:'Acessibilidade',city:'Rio de Janeiro',institution:'CEFET',tags:['Acessibilidade','Visão computacional'],projects:['p2']}
]

export const projects: Project[] = [
 {id:'p1',slug:'aqua',title:'Aqua',shortDescription:'Sistema inteligente para monitoramento de consumo de água em escolas.',problem:'Escolas possuem dificuldade para identificar desperdícios e vazamentos rapidamente.',solution:'Sensores conectados monitoram consumo e apresentam alertas e indicadores para gestores.',stage:'Protótipo',tags:['Arduino','IoT','Sensores','Dashboard web'],category:'Sustentabilidade',location:'Rio de Janeiro, RJ',author:{type:'team',id:'t1'},files:[{id:'f1',name:'apresentacao-aqua.pdf',type:'PDF'}],updates:[{id:'up1',text:'Novo protótipo do sensor validado em bancada.',date:'22 ago 2026'}],likes:42,readme:'## Aqua\nProjeto para tornar o consumo de água mais visível e acionável dentro de escolas.'},
 {id:'p2',slug:'visionaid',title:'VisionAid',shortDescription:'Visão computacional para auxiliar pessoas com deficiência visual na identificação de obstáculos.',problem:'Ambientes urbanos apresentam obstáculos imprevisíveis e pouca informação acessível em tempo real.',solution:'Câmera e modelo de visão computacional detectam obstáculos e geram alertas simples ao usuário.',stage:'MVP',tags:['Visão computacional','Acessibilidade','IA'],category:'Saúde e acessibilidade',location:'Rio de Janeiro, RJ',author:{type:'team',id:'t5'},files:[],updates:[{id:'up2',text:'Teste interno do modelo atualizado.',date:'20 ago 2026'}],likes:67,readme:'## VisionAid\nTecnologia assistiva focada em autonomia.'},
 {id:'p3',slug:'reciclo',title:'ReCiclo',shortDescription:'Plataforma para incentivar coleta seletiva dentro de escolas.',problem:'A coleta seletiva existe em muitas escolas, mas com baixa adesão e pouca visibilidade dos resultados.',solution:'Missões, metas coletivas e indicadores tornam a participação mais clara sem depender de competição individual.',stage:'Validação',tags:['Educação','Sustentabilidade','Web'],category:'Sustentabilidade',location:'Niterói, RJ',author:{type:'team',id:'t3'},files:[],updates:[],likes:31,readme:'## ReCiclo\nEngajamento coletivo para hábitos sustentáveis.'},
 {id:'p4',slug:'edumatch',title:'EduMatch',shortDescription:'Sistema que conecta estudantes a oportunidades educacionais compatíveis com seus interesses.',problem:'Oportunidades de cursos, bolsas e competições ficam dispersas em vários canais.',solution:'Perfil de interesses e filtros organizam oportunidades em uma jornada simples.',stage:'Protótipo',tags:['EdTech','IA','Recomendação'],category:'Educação',location:'Rio de Janeiro, RJ',author:{type:'team',id:'t2'},files:[],updates:[{id:'up4',text:'Primeiro fluxo de recomendação publicado.',date:'18 ago 2026'}],likes:54,readme:'## EduMatch\nDescoberta de oportunidades educacionais com contexto.'},
 {id:'p5',slug:'solartrack',title:'SolarTrack',shortDescription:'Monitoramento de microgeração solar para laboratórios escolares.',problem:'Escolas com painéis solares raramente transformam os dados de geração em aprendizado.',solution:'Dashboard didático conecta dados reais de geração a atividades de ciência e tecnologia.',stage:'Ideia',tags:['Energia','IoT','Educação'],category:'Energia',location:'Duque de Caxias, RJ',author:{type:'user',id:'u8'},files:[],updates:[],likes:19,readme:'## SolarTrack'}
]

export const courses: Course[] = [
 {id:'c1',slug:'da-ideia-ao-projeto',title:'Da ideia ao projeto',description:'Aprenda a transformar um problema real em uma solução estruturada.',instructor:'Equipe Envista',level:'Iniciante',duration:'4h 20min',modules:[
  {id:'m1',title:'Encontrando problemas',lessons:[{id:'l1',title:'O que é um problema real?',description:'Como diferenciar sintomas, ideias e problemas.'},{id:'l2',title:'Observação',description:'Observe contexto, pessoas e limitações.'},{id:'l3',title:'Pesquisa',description:'Reúna evidências antes de propor solução.'}]},
  {id:'m2',title:'Validação',lessons:[{id:'l4',title:'Hipóteses',description:'Transforme certezas em hipóteses testáveis.'},{id:'l5',title:'Entrevistas',description:'Converse sem induzir respostas.'}]},
  {id:'m3',title:'Solução',lessons:[{id:'l6',title:'Proposta de valor',description:'Defina para quem, qual problema e por que agora.'},{id:'l7',title:'Protótipo',description:'Teste antes de construir demais.'}]},
  {id:'m4',title:'Apresentação',lessons:[{id:'l8',title:'Narrativa',description:'Apresente contexto, evidência e solução.'}]},
  {id:'m5',title:'Execução',lessons:[{id:'l9',title:'Plano de próximos passos',description:'Defina prioridades e responsáveis.'}]},
  {id:'m6',title:'Projeto final',lessons:[{id:'l10',title:'Publicando seu projeto',description:'Transforme o aprendizado em portfólio.'}]}
 ]},
 {id:'c2',slug:'validacao-na-pratica',title:'Validação na prática',description:'Teste hipóteses com pessoas reais e evidências simples.',instructor:'Equipe Envista',level:'Intermediário',duration:'2h 10min',modules:[{id:'m1',title:'Fundamentos',lessons:[{id:'v1',title:'Hipóteses e evidências',description:'O que precisa ser verdade?'}]}]},
 {id:'c3',slug:'apresentar-projeto',title:'Como apresentar seu projeto',description:'Construa apresentações claras para bancas, parceiros e competições.',instructor:'Equipe Envista',level:'Iniciante',duration:'1h 40min',modules:[{id:'m1',title:'Pitch',lessons:[{id:'a1',title:'Estrutura de uma boa apresentação',description:'Problema, solução, evidência e próximo passo.'}]}]},
 {id:'c4',slug:'introducao-inovacao',title:'Introdução à inovação',description:'Fundamentos para começar a construir soluções.',instructor:'Equipe Envista',level:'Iniciante',duration:'2h',modules:[{id:'m1',title:'Começo',lessons:[{id:'i1',title:'Inovação sem mito',description:'Resolver melhor antes de inventar mais.'}]}]},
 {id:'c5',slug:'preparacao-competicoes',title:'Preparação para competições',description:'Organize equipe, documentação, testes e apresentação.',instructor:'Equipe Envista',level:'Intermediário',duration:'3h 15min',modules:[{id:'m1',title:'Competir com método',lessons:[{id:'p1',title:'Critérios e estratégia',description:'Leia regulamentos como requisito de produto.'}]}]}
]

export const competitions: Competition[] = [
 {id:'co1',slug:'envista-challenge-2026',title:'Envista Challenge 2026',type:'envista',status:'Inscrições abertas',deadline:'30 set 2026',organization:'Envista',location:'Híbrido',format:'Online + final presencial',categories:['Tecnologia','Educação','Sustentabilidade','Impacto social'],prize:'R$ 10.000 em premiações',description:'Desafio para equipes jovens que estejam transformando problemas reais em soluções demonstráveis.'},
 {id:'co2',slug:'obt',title:'Olimpíada Brasileira de Tecnologia',type:'external',status:'Oportunidade externa',organization:'Organização externa',location:'Brasil',format:'Consultar site oficial',categories:['Tecnologia'],description:'Oportunidade externa listada para descoberta. Consulte o site oficial para regras, etapas e datas atualizadas.'},
 {id:'co3',slug:'jovens-inovadores',title:'Desafio Jovens Inovadores',type:'envista',status:'Próxima',deadline:'15 nov 2026',organization:'Envista + parceiros',location:'Rio de Janeiro, RJ',format:'Presencial',categories:['Educação','IA','Impacto social'],prize:'Mentorias e premiações',description:'Desafio prático para transformar uma ideia em um protótipo apresentado a uma banca.'}
]
