function disabled(){return Response.json({error:'Mobile-number admin access is no longer used.'},{status:410});}
export const GET=disabled;
export const POST=disabled;
export const DELETE=disabled;
