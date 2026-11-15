import { describe, expect, it } from "vitest";
// @ts-expect-error React is resolved from the web workspace for this SSR test.
import { createElement } from "../../web/node_modules/react/index.js";
// @ts-expect-error React DOM is resolved from the web workspace for this SSR test.
import { renderToStaticMarkup } from "../../web/node_modules/react-dom/server.js";
import type { GrammarListItem } from "@app/shared";
import GrammarCard from "../../web/src/features/grammar/components/GrammarCard.js";
import GrammarListPage, {
  type GrammarListLocationState,
} from "../../web/src/features/grammar/pages/GrammarListPage.js";
import { AuthContext } from "../../web/src/contexts/auth-context.js";
import { MemoryRouter } from "../../web/node_modules/react-router/dist/development/index.js";

function renderWithRouter(element: unknown, state?: GrammarListLocationState) {
  return renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      {
        value: {
          user: null,
          isLoading: false,
          refreshUser: async () => {},
          logout: async () => {},
        },
      },
      createElement(
        MemoryRouter,
        { initialEntries: [{ pathname: "/grammar", state }] },
        element,
      ),
    ),
  );
}

const grammar: GrammarListItem = {
  id: 15,
  title: "Xin phép, cho phép",
  pattern: "〜てもいいです",
  meaning: "Làm ~ cũng được",
  jlpt: 4,
};

describe("grammar list frontend", () => {
  it("renders the styled search bar", () => {
    const markup = renderWithRouter(createElement(GrammarListPage));

    expect(markup).toContain('class="grammar-search"');
    expect(markup).toContain("Tất cả cấp độ");
  });

  it("restores keyword and JLPT level when coming back from a detail page", () => {
    const markup = renderWithRouter(createElement(GrammarListPage), {
      page: 1,
      keyword: "được",
      jlpt: "4",
    });

    expect(markup).toContain('value="được"');
    expect(markup).toMatch(/<option value="4" selected="">N4<\/option>/);
    expect(markup).toContain("Kết quả tìm kiếm");
  });

  it("starts with an empty search when opened directly", () => {
    const markup = renderWithRouter(createElement(GrammarListPage));

    expect(markup).toContain('value=""');
    expect(markup).toContain("Tổng số ngữ pháp");
  });

  it("renders a card with pattern, JLPT badge, title and meaning", () => {
    const markup = renderWithRouter(createElement(GrammarCard, { grammar }));

    expect(markup).toContain('href="/grammar/15"');
    expect(markup).toContain('class="grammar-card-top"');
    expect(markup).toContain("grammar-jlpt grammar-jlpt-n4");
    expect(markup).toContain("〜てもいいです");
    expect(markup).toContain("Xin phép, cho phép");
    expect(markup).toContain("Làm ~ cũng được");
  });
});
