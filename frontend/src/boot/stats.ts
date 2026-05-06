import { defineBoot } from '#q-app/wrappers';
import { trackPageView } from 'src/composables/useVisitTracking';

export default defineBoot(() => {
  void trackPageView(true);
});
