export const deliveryMethod = (
  deliveredOnline: boolean,
  deliveredOnSite: boolean,
): string => {
  if (deliveredOnline && deliveredOnSite) {
    return "Blended";
  }
  if (deliveredOnSite) {
    return "Onsite";
  }
  return "Online";
};
