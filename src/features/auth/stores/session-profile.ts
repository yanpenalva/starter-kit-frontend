import { computed, ref } from "vue";
import type { WritableComputedRef } from "vue";
import { getAuthMyProfileQueryKey } from "@/lib/api/generated";
import type {
  AuthMyProfile200,
  MyProfileResource,
} from "@/lib/api/generated/models";
import { queryClient } from "@/app/providers/query";

const profileQueryKey = getAuthMyProfileQueryKey();
const profileRevision = ref(0);

const sameProfileQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey.length === profileQueryKey.length &&
  queryKey.every((part, index) => part === profileQueryKey[index]);

queryClient.getQueryCache().subscribe((event) => {
  if (sameProfileQuery(event.query.queryKey)) {
    profileRevision.value += 1;
  }
});

export const createSessionUser =
  (): WritableComputedRef<MyProfileResource | null> =>
    computed({
      get: () => {
        void profileRevision.value;
        return (
          queryClient.getQueryData<AuthMyProfile200>(profileQueryKey)?.data ??
          null
        );
      },
      set: (profile) => {
        if (profile === null) {
          queryClient.removeQueries({ queryKey: profileQueryKey, exact: true });
          return;
        }
        queryClient.setQueryData<AuthMyProfile200>(profileQueryKey, {
          data: profile,
        });
      },
    });
