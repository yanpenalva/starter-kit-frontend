import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import Pagination from "./Pagination.vue";

type Meta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const mountPagination = (meta: Partial<Meta> = {}, props = {}) =>
  mount(Pagination, {
    props: {
      meta: { current_page: 1, last_page: 3, per_page: 15, total: 45, ...meta },
      ...props,
    },
  });

const button = (wrapper: ReturnType<typeof mountPagination>, label: string) =>
  wrapper.get(`button[aria-label="${label}"]`);

describe("Pagination.vue", () => {
  it("describes the range and current page from meta", () => {
    const wrapper = mountPagination({
      current_page: 2,
      last_page: 3,
      per_page: 15,
      total: 45,
    });

    expect(wrapper.get(".ui-pagination__range").text()).toBe("16–30 de 45");
    expect(wrapper.get(".ui-pagination__status").text()).toContain(
      "Página 2 de 3",
    );
  });

  it("shows 0–0 of 0 when the list is empty", () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    });

    expect(wrapper.get(".ui-pagination__range").text()).toBe("0–0 de 0");
    expect(wrapper.get(".ui-pagination__status").text()).toContain(
      "Página 1 de 1",
    );
    expect(
      button(wrapper, "Página anterior").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(wrapper, "Próxima página").attributes("disabled"),
    ).toBeDefined();
  });

  it("does not highlight first/last page when there are two pages", () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 2,
      per_page: 15,
      total: 20,
    });

    expect(wrapper.find('button[aria-label="Primeira página"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('button[aria-label="Última página"]').exists()).toBe(
      false,
    );
  });

  it("disables navigation outside the bounds", async () => {
    const first = mountPagination({ current_page: 1, last_page: 4, total: 60 });
    expect(
      button(first, "Página anterior").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(first, "Primeira página").attributes("disabled"),
    ).toBeDefined();
    expect(
      button(first, "Próxima página").attributes("disabled"),
    ).toBeUndefined();

    const last = mountPagination({ current_page: 4, last_page: 4, total: 60 });
    expect(button(last, "Próxima página").attributes("disabled")).toBeDefined();
    expect(button(last, "Última página").attributes("disabled")).toBeDefined();
    expect(
      button(last, "Página anterior").attributes("disabled"),
    ).toBeUndefined();
  });

  it("emits the page change requested by the user", async () => {
    const wrapper = mountPagination({
      current_page: 2,
      last_page: 4,
      total: 60,
    });

    await button(wrapper, "Próxima página").trigger("click");
    await button(wrapper, "Página anterior").trigger("click");
    await button(wrapper, "Primeira página").trigger("click");
    await button(wrapper, "Última página").trigger("click");

    expect(wrapper.emitted("change")).toEqual([[3], [1], [1], [4]]);
  });

  it("does not emit when the target is the current page", async () => {
    const wrapper = mountPagination({
      current_page: 1,
      last_page: 1,
      total: 5,
      per_page: 15,
    });

    await button(wrapper, "Próxima página").trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
  });

  it("blocks navigation while disabled", async () => {
    const wrapper = mountPagination(
      { current_page: 1, last_page: 3 },
      {
        disabled: true,
      },
    );

    expect(wrapper.get("nav").attributes("aria-busy")).toBe("true");
    await button(wrapper, "Próxima página").trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
  });

  it("emits a valid per-page option", async () => {
    const wrapper = mountPagination(
      { per_page: 10 },
      { perPageOptions: [5, 10, 15, 25, 50] },
    );

    await wrapper.get('select[aria-label="Itens por página"]').setValue("25");

    expect(wrapper.emitted("per-page-change")).toEqual([[25]]);
  });

  it("blocks page-size change during a search", async () => {
    const wrapper = mountPagination(
      { per_page: 10 },
      { disabled: true, perPageOptions: [5, 10, 15, 25, 50] },
    );

    const select = wrapper.get('select[aria-label="Itens por página"]');
    expect(select.attributes("disabled")).toBeDefined();
    await select.setValue("25");

    expect(wrapper.emitted("per-page-change")).toBeUndefined();
  });
});
