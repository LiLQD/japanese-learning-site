import { beforeEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error React is resolved from the web workspace for this SSR test.
import { createElement } from "../../web/node_modules/react/index.js";
// @ts-expect-error React DOM is resolved from the web workspace for this SSR test.
import { renderToStaticMarkup } from "../../web/node_modules/react-dom/server.js";
import type { GrammarListItem, GrammarListResponse } from "@app/shared";
import {
  CONNECTION_ERROR,
  fetchAdminGrammarList,
} from "../../web/src/features/grammar/api.js";
import GrammarAdminTable from "../../web/src/features/grammar/components/GrammarAdminTable.js";
import GrammarAdminPage from "../../web/src/features/grammar/pages/GrammarAdminPage.js";
import { AuthContext } from "../../web/src/contexts/auth-context.js";
import { MemoryRouter } from "../../web/node_modules/react-router/dist/development/index.js";

const grammar: GrammarListItem = {
  id: 42,
  title: "Câu mẫu",
  pattern: "〜てもいい",
  meaning: "Được phép",
  jlpt: 4,
};

function renderAdminPage(
  user: { id: number; role: "ADMIN" | "USER" } | null,
  isLoading = false,
) {
  return renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      {
        value: {
          user: user
            ? {
                ...user,
                displayName: "Yume User",
                email: "user@example.com",
              }
            : null,
          isLoading,
          refreshUser: async () => {},
          logout: async () => {},
        },
      },
      createElement(MemoryRouter, null, createElement(GrammarAdminPage)),
    ),
  );
}

describe("grammar admin frontend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows login prompt to a guest without rendering admin content", () => {
    const markup = renderAdminPage(null);

    expect(markup).toContain("đăng nhập");
    expect(markup).not.toContain("Quản lý ngữ pháp");
  });

  it("denies a USER without rendering admin content", () => {
    const markup = renderAdminPage({ id: 2, role: "USER" });

    expect(markup).toContain("Bạn không có quyền truy cập trang này.");
    expect(markup).not.toContain("<table");
  });

  it("shows the loading state while the current user is being checked", () => {
    const markup = renderAdminPage(null, true);

    expect(markup).toContain("Đang kiểm tra phiên đăng nhập...");
  });

  it("allows an ADMIN and starts with a loading state for the list", () => {
    const markup = renderAdminPage({ id: 1, role: "ADMIN" });

    expect(markup).toContain("Quản lý ngữ pháp");
    expect(markup).toContain("Đang tải danh sách...");
  });

  it("requests the protected endpoint with credentials and returns API data", async () => {
    const responseBody: GrammarListResponse = {
      grammars: [grammar],
      total: 1,
      page: 2,
      pageSize: 20,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdminGrammarList(2, 20)).resolves.toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/grammar?page=2&pageSize=20",
      { credentials: "include" },
    );
  });

  it("shows the required message for a rejected network request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(fetchAdminGrammarList(1, 20)).rejects.toThrow(
      "L\u1ed7i k\u1ebft n\u1ed1i!",
    );
    expect(CONNECTION_ERROR).toBe("L\u1ed7i k\u1ebft n\u1ed1i!");
  });

  it("keeps unrelated server failures distinct from connection failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "INTERNAL", message: "Internal server error" },
          }),
          { status: 500 },
        ),
      ),
    );

    await expect(fetchAdminGrammarList(1, 20)).rejects.toThrow(
      "Internal server error",
    );
  });

  it("renders grammar details, row numbering and only valid JLPT levels", () => {
    const markup = renderToStaticMarkup(
      createElement(GrammarAdminTable, {
        grammars: [
          grammar,
          { ...grammar, id: 43, jlpt: 6 },
          { ...grammar, id: 44, jlpt: null },
        ],
        page: 2,
        pageSize: 20,
      }),
    );

    expect(markup).toContain("<td>21</td><td>42</td>");
    expect(markup).toContain("Câu mẫu");
    expect(markup).toContain("〜てもいい");
    expect(markup).toContain("Được phép");
    expect(markup).toContain("N4");
    expect(markup.match(/—/g)).toHaveLength(2);
  });

  it("renders the exact empty state", () => {
    const markup = renderToStaticMarkup(
      createElement(GrammarAdminTable, {
        grammars: [],
        page: 1,
        pageSize: 20,
      }),
    );

    expect(markup).toContain("Chưa có dữ liệu ngữ pháp");
  });
});
