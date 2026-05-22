import { fetchNOMIS } from '@/lib/fetch-nomis';
import { fetchIMD } from '@/lib/fetch-imd';
import { fetchGVA } from '@/lib/fetch-gva';
import { mergeData } from '@/lib/data';
import type { DataSources, DataMeta } from '@/lib/types';
import Dashboard from './components/Dashboard';

export const revalidate = 3600;

export default async function Home() {
  const dsrc: DataSources = { nomis: 'cached', imd: 'cached', gva: 'cached' };
  const dsmeta: DataMeta = {
    nomis: { count: null, date: null, err: null },
    imd: { lsoas: null, wards: null, err: null },
    gva: { count: null, err: null },
  };

  const [nomisResult, imdResult, gvaResult] = await Promise.allSettled([
    fetchNOMIS(),
    fetchIMD(),
    fetchGVA(),
  ]);

  let nMap = null, nDate = 'Jan 2026';
  if (nomisResult.status === 'fulfilled') {
    nMap = nomisResult.value.map;
    nDate = nomisResult.value.date;
    dsrc.nomis = 'live';
    dsmeta.nomis = { count: nomisResult.value.count, date: nDate, err: null };
  } else {
    dsmeta.nomis.err = String(nomisResult.reason);
  }

  let iMap = null;
  if (imdResult.status === 'fulfilled') {
    iMap = imdResult.value.map;
    dsrc.imd = 'live';
    dsmeta.imd = { lsoas: imdResult.value.lsoas, wards: imdResult.value.wards, err: null };
  } else {
    dsmeta.imd.err = String(imdResult.reason);
  }

  let gMap = null, popMap = null;
  if (gvaResult.status === 'fulfilled') {
    gMap = gvaResult.value.map;
    popMap = gvaResult.value.popMap;
    dsrc.gva = 'live';
    dsmeta.gva = { count: gvaResult.value.count, err: null };
  } else {
    dsmeta.gva.err = String(gvaResult.reason);
  }

  const wards = mergeData(nMap, iMap, gMap, popMap);

  return <Dashboard wards={wards} dsrc={dsrc} dsmeta={dsmeta} nomisDate={nDate} />;
}
