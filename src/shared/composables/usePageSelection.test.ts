import { effectScope, nextTick, ref } from "vue";
import type { EffectScope, Ref } from "vue";
import { describe, expect, it } from "vitest";
import { usePageSelection } from "./usePageSelection";
import type { PageSelection } from "./usePageSelection";

interface Harness {
  readonly selection: PageSelection;
  readonly scope: EffectScope;
  readonly visible: Ref<number[]>;
  readonly enabled: Ref<boolean>;
  readonly scopeKey: Ref<string>;
}

const setup = (ids: readonly number[] = [1, 2, 3]): Harness => {
  const visible = ref<number[]>([...ids]);
  const enabled = ref(true);
  const scopeKey = ref("page-1");
  const scope = effectScope();
  const selection = scope.run(() =>
    usePageSelection({
      visibleIds: () => visible.value,
      enabled: () => enabled.value,
      scopeKey: () => scopeKey.value,
    }),
  ) as PageSelection;
  return { selection, scope, visible, enabled, scopeKey };
};

describe("usePageSelection", () => {
  it("selects only visible IDs and counts checked rows", () => {
    const { selection } = setup([1, 2, 3]);

    expect(selection.selectedCount.value).toBe(0);
    expect(selection.isSelected(1)).toBe(false);

    selection.setSelected(1, true);

    expect(selection.isSelected(1)).toBe(true);
    expect(selection.selectedCount.value).toBe(1);
    expect(selection.selectedIds.value).toEqual([1]);

    selection.setSelected(99, true);

    expect(selection.selectedCount.value).toBe(1);
    expect(selection.selectedIds.value).toEqual([1]);
  });

  it("marks the header as indeterminate on partial selection and complete when all are selected", () => {
    const { selection } = setup([1, 2, 3]);

    selection.setSelected(1, true);

    expect(selection.isIndeterminate.value).toBe(true);
    expect(selection.isAllSelected.value).toBe(false);

    selection.setSelected(2, true);

    expect(selection.isIndeterminate.value).toBe(true);

    selection.setSelected(3, true);

    expect(selection.isAllSelected.value).toBe(true);
    expect(selection.isIndeterminate.value).toBe(false);
  });

  it("removes an ID when unchecking the row", () => {
    const { selection } = setup([1, 2, 3]);

    selection.setSelected(2, true);
    selection.setSelected(3, true);
    selection.setSelected(2, false);

    expect(selection.selectedIds.value).toEqual([3]);
    expect(selection.isIndeterminate.value).toBe(true);
  });

  it("toggleAll selects all page IDs and clicking again clears", () => {
    const { selection } = setup([1, 2, 3]);

    selection.toggleAll(true);

    expect(selection.selectedIds.value).toEqual([1, 2, 3]);
    expect(selection.isAllSelected.value).toBe(true);

    selection.toggleAll(false);

    expect(selection.selectedCount.value).toBe(0);
    expect(selection.isAllSelected.value).toBe(false);

    selection.toggleAll();
    expect(selection.selectedIds.value).toEqual([1, 2, 3]);

    selection.toggleAll();
    expect(selection.selectedCount.value).toBe(0);
  });

  it("clears the selection when search, filters, page, or per_page change", async () => {
    const { selection, scopeKey } = setup([1, 2, 3]);

    selection.setSelected(1, true);
    selection.setSelected(2, true);
    expect(selection.selectedCount.value).toBe(2);

    scopeKey.value = "page-2|per_page=15";
    await nextTick();

    expect(selection.selectedCount.value).toBe(0);
    expect(selection.isSelected(1)).toBe(false);
  });

  it("reconciles after refetch keeping only present IDs", async () => {
    const { selection, visible } = setup([1, 2, 3]);

    selection.setSelected(1, true);
    selection.setSelected(2, true);
    selection.setSelected(3, true);

    visible.value = [1, 3, 4];
    await nextTick();

    expect(selection.selectedIds.value).toEqual([1, 3]);
    expect(selection.selectedCount.value).toBe(2);
    expect(selection.isSelected(4)).toBe(false);
    expect(selection.isAllSelected.value).toBe(false);
  });

  it("disables the header with no records, while loading, and on error", async () => {
    const empty = setup([]);
    expect(empty.selection.isSelectable.value).toBe(false);
    empty.selection.toggleAll(true);
    expect(empty.selection.selectedCount.value).toBe(0);

    const { selection, enabled } = setup([1, 2]);
    expect(selection.isSelectable.value).toBe(true);

    enabled.value = false;
    await nextTick();

    expect(selection.isSelectable.value).toBe(false);
    selection.setSelected(1, true);
    expect(selection.selectedCount.value).toBe(0);
    selection.toggleAll(true);
    expect(selection.selectedCount.value).toBe(0);
  });

  it("allows unchecking and explicit clearing", async () => {
    const { selection, enabled } = setup([1, 2]);

    selection.setSelected(1, true);
    enabled.value = false;
    await nextTick();

    selection.setSelected(1, false);
    expect(selection.selectedCount.value).toBe(0);

    enabled.value = true;
    await nextTick();
    selection.toggleAll(true);
    selection.clear();

    expect(selection.selectedCount.value).toBe(0);
    expect(selection.isIndeterminate.value).toBe(false);
  });

  it("resets the selection when leaving the view", async () => {
    const { selection, scope } = setup([1, 2, 3]);

    selection.toggleAll(true);
    expect(selection.selectedCount.value).toBe(3);

    scope.stop();
    await nextTick();

    expect(selection.selectedCount.value).toBe(0);
  });
});
