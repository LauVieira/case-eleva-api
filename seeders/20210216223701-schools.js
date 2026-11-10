'use strict';

const normaliseName = require('../src/utils/normaliseName');

const SCHOOLS = [
  {
    sectorCode: 'SA-1',
    currentProfile: null,
    name: 'escola municipal horizonte claro',
    address: 'Rua das Gaivotas, 120, Bairro Lago Azul',
    headteacher: 'Helena Duarte',
    phone: '+5511987650101',
  },
  {
    sectorCode: 'SA-2',
    currentProfile: 'all',
    name: 'centro integrado de educação pública vale sereno',
    address: 'Avenida do Vale, 45, Bairro Sereno',
    headteacher: 'Marcos Vieira',
    phone: '+552133445501',
  },
  {
    sectorCode: 'SA-2',
    currentProfile: null,
    name: 'colégio municipal rio das pedras',
    address: 'Rua das Pedras, 210, Bairro Ribeirão',
    headteacher: null,
    phone: '+5531987650103',
  },
  {
    sectorCode: 'SA-2',
    currentProfile: null,
    name: 'escola municipal jardim das acácias',
    address: 'Alameda das Acácias, 88, Bairro Jardim Novo',
    headteacher: 'Lúcia Andrade',
    phone: '+554133445504',
  },
  {
    sectorCode: 'SA-3',
    currentProfile: 'sample',
    name: 'escola municipal canto dos ipês',
    address: 'Travessa dos Ipês, 15, Bairro Canto Verde',
    headteacher: 'Paulo Nogueira',
    phone: null,
  },
  {
    sectorCode: 'SA-4',
    currentProfile: null,
    name: 'escola municipal lagoa dourada',
    address: 'Rua da Lagoa, 340, Bairro Dourado',
    headteacher: 'Renata Campos',
    phone: '+5551987650106',
  },
  {
    sectorCode: 'SA-4',
    currentProfile: 'early',
    name: 'centro integrado de educação pública ponte nova',
    address: 'Avenida da Ponte, 12, Bairro Nova Esperança',
    headteacher: 'João Batista Melo',
    phone: '+556133445507',
  },
  {
    sectorCode: 'SA-4',
    currentProfile: null,
    name: 'colégio municipal serra azul',
    address: 'Rua da Serra, 501, Bairro Azul',
    headteacher: null,
    phone: null,
  },
  {
    sectorCode: 'SA-4',
    currentProfile: null,
    name: 'escola municipal vila das palmeiras',
    address: 'Praça das Palmeiras, 7, Vila das Palmeiras',
    headteacher: 'Carla Mendonça',
    phone: '+5571987650109',
  },
  {
    sectorCode: 'SA-5',
    currentProfile: null,
    name: 'escola municipal recanto do sol',
    address: 'Rua do Recanto, 64, Bairro Sol Nascente',
    headteacher: 'Otávio Pires',
    phone: '+558133445510',
  },
  {
    sectorCode: 'SA-6',
    currentProfile: 'fundamental',
    name: 'escola municipal bosque das araucárias',
    address: 'Alameda das Araucárias, 190, Bairro Bosque',
    headteacher: 'Beatriz Fonseca',
    phone: '+5511911110011',
  },
  {
    sectorCode: 'SA-6',
    currentProfile: null,
    name: 'centro integrado de educação pública morro alto',
    address: 'Rua do Morro, 33, Bairro Alto',
    headteacher: 'Diego Albuquerque',
    phone: '+5521922220012',
  },
  {
    sectorCode: 'SA-6',
    currentProfile: 'later',
    name: 'colégio municipal praça das flores',
    address: 'Praça das Flores, 2, Centro',
    headteacher: 'Fernanda Lopes',
    phone: '+5531333330013',
  },
  {
    sectorCode: 'SA-6',
    currentProfile: null,
    name: 'escola municipal caminho verde',
    address: 'Rua do Caminho, 418, Bairro Verde',
    headteacher: 'Sérgio Tavares',
    phone: null,
  },
  {
    sectorCode: 'SA-6',
    currentProfile: null,
    name: 'escola municipal ancoradouro',
    address: 'Rua do Ancoradouro, 27, Bairro Porto',
    headteacher: 'Marina Costa',
    phone: '+5541944440015',
  },
  {
    sectorCode: 'SA-7',
    currentProfile: null,
    name: 'escola municipal campo aberto',
    address: 'Estrada do Campo, 900, Bairro Aberto',
    headteacher: 'Ana Beatriz Ramos',
    phone: '+5551355550016',
  },
  {
    sectorCode: 'SA-8',
    currentProfile: null,
    name: 'escola municipal lua nova',
    address: 'Rua da Lua, 11, Bairro Nova Luz',
    headteacher: 'Henrique Salazar',
    phone: '+5561966660017',
  },
  {
    sectorCode: 'SA-8',
    currentProfile: 'sample',
    name: 'centro integrado de educação pública estrela do norte',
    address: 'Avenida da Estrela, 76, Bairro Norte',
    headteacher: 'Camila Borges',
    phone: '+5571377770018',
  },
  {
    sectorCode: 'SA-8',
    currentProfile: null,
    name: 'colégio municipal ribeira clara',
    address: 'Rua da Ribeira, 255, Bairro Clara',
    headteacher: null,
    phone: '+5581988880019',
  },
  {
    sectorCode: 'SA-9',
    currentProfile: null,
    name: 'escola municipal pedra lisa',
    address: 'Travessa da Pedra, 5, Bairro da Pedreira',
    headteacher: 'Patrícia Gomes',
    phone: '+5511300000020',
  },
  {
    sectorCode: 'SA-10',
    currentProfile: 'infancy-and-medium',
    name: 'escola municipal vento leste',
    address: 'Rua do Vento, 140, Bairro Leste',
    headteacher: 'Rodrigo Leal',
    phone: '+5521411110021',
  },
  {
    sectorCode: 'SA-10',
    currentProfile: null,
    name: 'centro integrado de educação pública atlas',
    address: 'Avenida Atlas, 1000, Bairro Central',
    headteacher: 'Elisa Monteiro',
    phone: '+5531522220022',
  },
  {
    sectorCode: 'SA-10',
    currentProfile: 'sample',
    name: 'colégio municipal maré mansa',
    address: 'Rua da Maré, 58, Bairro Mansa',
    headteacher: 'Gustavo Reis',
    phone: '+5541633330023',
  },
  {
    sectorCode: 'SA-10',
    currentProfile: null,
    name: 'escola municipal trilha do cedro',
    address: 'Trilha do Cedro, 3, Bairro da Mata',
    headteacher: 'Vera Lúcia Martins',
    phone: '+5551744440024',
  },
  {
    sectorCode: 'SA-11',
    currentProfile: null,
    name: 'escola municipal orvalho',
    address: 'Rua do Orvalho, 22, Bairro Branco',
    headteacher: 'Igor Santana',
    phone: '+5561855550025',
  },
];

module.exports = {
  SCHOOLS,

  up: async (queryInterface) => {
    const now = new Date();
    const [sectors] = await queryInterface.sequelize.query('SELECT id, code FROM sectors');
    const sectorIdByCode = new Map(sectors.map((sector) => [sector.code, sector.id]));
    const rows = SCHOOLS.map((school) => {
      const sectorId = sectorIdByCode.get(school.sectorCode);
      if (!sectorId) throw new Error(`Setor não encontrado para a escola ${school.name}: ${school.sectorCode}`);
      return {
        sectorId,
        name: normaliseName(school.name),
        address: school.address.trim(),
        headteacher: school.headteacher,
        phone: school.phone,
        createdAt: now,
        updatedAt: now,
      };
    });

    await queryInterface.bulkInsert('schools', rows, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('schools', null, {});
  },
};
