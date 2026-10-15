import Workspace from './workspace';
import {canManagePackages} from './package-access';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<{connection?:string}>}){const query=await searchParams;return <Workspace canManagePackages={await canManagePackages()} initialConnection={query.connection==='addon'?'addon':'mobile'}/>;}
