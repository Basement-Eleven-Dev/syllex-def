import { trigger, transition, style, animate } from '@angular/animations';

export const routeTransitionAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    style({ opacity: 0.5 }),
    animate('350ms linear', style({ opacity: 1 })),
  ]),
]);
