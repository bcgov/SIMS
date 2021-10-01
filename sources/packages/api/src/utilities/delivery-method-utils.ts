export function deliveryMethod(
  deliveredOnline: boolean,
  deliveredOnSite: boolean,
): string {
  if (this.deliveredOnline && this.deliveredOnSite) {
    return "Blended";
  } else if (this.deliveredOnSite) {
    return "Onsite";
  } else {
    return "Online";
  }
}
