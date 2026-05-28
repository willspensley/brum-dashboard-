import { fetchNOMIS } from '@/lib/fetch-nomis';
import { fetchIMD } from '@/lib/fetch-imd';
import { fetchGVA } from '@/lib/fetch-gva';
import { fetchCrime } from '@/lib/fetch-crime';
import { fetchQualifications, fetchEducationIMD, EDU_FALLBACK, assignEduRanks } from '@/lib/fetch-education';
import { mergeData } from '@/lib/data';
import type { DataSources, DataMeta, EducationWard, EduDataMeta } from '@/lib/types';
import Dashboard from './components/Dashboard';

export const revalidate = 3600;

export default async function Home() {
  const dsrc: DataSources = { nomis: 'cached', imd: 'cached', gva: 'cached', crime: 'cached' };
  const dsmeta: DataMeta = {
    nomis: { count: null, date: null, err: null },
    imd: { lsoas: null, wards: null, err: null },
    gva: { count: null, err: null },
    crime: { count: null, err: null },
  };

  const [nomisResult, imdResult, gvaResult, crimeResult, qualsResult, eduImdResult] = await Promise.allSettled([
    fetchNOMIS(),
    fetchIMD(),
    fetchGVA(),
    fetchCrime(),
    fetchQualifications(),
    fetchEducationIMD(),
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

  let crimeMap = null;
  if (crimeResult.status === 'fulfilled') {
    crimeMap = crimeResult.value.map;
    dsrc.crime = 'live';
    dsmeta.crime = { count: crimeResult.value.count, err: null };
  } else {
    dsmeta.crime.err = String(crimeResult.reason);
  }

  // Education data
  const eduMeta: EduDataMeta = {
    quals: { wards: null, err: null, source: 'cached' },
    imd:   { wards: null, err: null, source: 'cached' },
  };
  let eduWards: EducationWard[] = EDU_FALLBACK.map(w => ({ ...w }));

  if (qualsResult.status === 'fulfilled' && qualsResult.value.count >= 60) {
    eduWards = qualsResult.value.wards;
    eduMeta.quals = { wards: qualsResult.value.count, err: null, source: 'live' };
    const codeSet = new Set(eduWards.map(w => w.ward_code));
    for (const fb of EDU_FALLBACK) {
      if (!codeSet.has(fb.ward_code)) eduWards.push({ ...fb });
    }
  } else if (qualsResult.status === 'rejected') {
    eduMeta.quals.err = String(qualsResult.reason);
  }

  if (eduImdResult.status === 'fulfilled' && eduImdResult.value.count > 0) {
    const imdMap = eduImdResult.value.map;
    eduMeta.imd = { wards: eduImdResult.value.count, err: null, source: 'live' };
    eduWards = eduWards.map(w => {
      const imd = imdMap[w.ward_code];
      if (imd) return { ...w, imd_edu_decile: imd.decile || w.imd_edu_decile, imd_edu_score: imd.score || w.imd_edu_score };
      return w;
    });
  } else if (eduImdResult.status === 'rejected') {
    eduMeta.imd.err = String(eduImdResult.reason);
  }

  assignEduRanks(eduWards);

  const wards = mergeData(nMap, iMap, gMap, popMap, crimeMap);

  return <Dashboard wards={wards} dsrc={dsrc} dsmeta={dsmeta} nomisDate={nDate} eduWards={eduWards} eduMeta={eduMeta} />;
}
