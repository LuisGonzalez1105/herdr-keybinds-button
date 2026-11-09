// Keybinds: a cheat sheet for Hermes, the Linux terminal and Herdr Desktop, one platform at a time.
// Click a row to expand a one-line explanation. Content lives in ./data.js.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, Scrollbar } from "gpui-base";
import { theme, settings } from "herdr";
import { PLATFORMS } from "./data.js";

export default class Keybinds extends View {
  init() {
    const saved = localStorage.getItem("platform");
    this.platform = PLATFORMS.some(p => p.id === saved) ? saved : PLATFORMS[0].id;
    this.open = new Set(JSON.parse(localStorage.getItem("open") ?? "[]"));
  }

  save() {
    localStorage.setItem("platform", this.platform);
    localStorage.setItem("open", JSON.stringify([...this.open]));
  }

  toggle(id, cx) {
    if (this.open.has(id)) this.open.delete(id); else this.open.add(id);
    this.save();
    cx.notify();
  }

  // One key as a keycap; a command (cmd) as a code chip.
  cap(label, t, cmd, i) {
    const mono = settings().font_family ?? "JetBrains Mono";
    return div().id(`cap-${i}`).h(20).min_w(20).px(cmd ? 7 : 6).flex().flex_none().items_center().justify_center()
      .rounded(5).border_1().border_b(2).border_color(t.border).bg(cmd ? t.surface : t.raised)
      .font_family(mono).text_size(11).text_color(cmd ? t.accent : t.foreground).whitespace_nowrap().child(label);
  }

  // [["Ctrl","U"]] -> Ctrl + U ; [["Esc"],["Esc"]] -> Esc  Esc ; alt -> "or" second binding.
  combo(item, t, color) {
    let n = 0;
    const steps = (keys) => keys.flatMap((step, s) => [
      ...(s > 0 ? [div().text_size(10).text_color(t.dim).child("then")] : []),
      ...step.flatMap((k, j) => [
        ...(j > 0 ? [div().text_size(10).text_color(t.dim).child("+")] : []),
        this.cap(k, t, item.cmd, `${item.id}-${n++}`),
      ]),
    ]);
    return h_flex().flex_none().items_center().gap(3)
      .children(steps(item.keys))
      .when(Boolean(item.alt), el => el.child(div().px(2).text_size(10).text_color(t.dim).child("or")).children(steps(item.alt)));
  }

  row(item, t, color) {
    const open = this.open.has(item.id);
    return v_flex().id(`row-${item.id}`).w_full().flex_none().rounded(7).overflow_hidden()
      .when(open, el => el.bg(color + "10"))
      .child(h_flex().id(`head-${item.id}`).w_full().min_h(32).px(8).py(4).gap(8).items_center().cursor_pointer()
        .hover(s => s.bg(t.hover))
        .on_click((_e, cx) => this.toggle(item.id, cx))
        .child(svg(open ? "mods/keybinds-button/chevron-down.svg" : "mods/keybinds-button/chevron-right.svg").size(12).flex_none()
          .text_color(open ? color : t.dim))
        .child(div().flex_1().min_w(0).text_size(12.5).text_color(open ? t.foreground : t.muted).child(item.label))
        .child(this.combo(item, t, color)))
      .when(open, el => el.child(h_flex().w_full().pl(28).pr(10).pb(9).gap(8)
        .child(div().w(2).flex_none().rounded(1).bg(color))
        .child(div().flex_1().min_w(0).text_size(11.5).line_height(17).text_color(t.foreground).child(item.desc))));
  }

  tab(p, t) {
    const on = p.id === this.platform, color = t[p.color];
    const count = p.groups.reduce((n, g) => n + g.items.length, 0);
    return h_flex().id(`tab-${p.id}`).flex_1().h(30).px(8).gap(6).items_center().justify_center().rounded(6).cursor_pointer()
      .bg(on ? color + "26" : t.surface).border_1().border_color(on ? color + "88" : t.surface)
      .text_color(on ? t.foreground : t.muted).hover(s => s.bg(on ? color + "30" : t.hover))
      .on_click((_e, cx) => { this.platform = p.id; this.save(); cx.notify(); })
      .child(div().size(7).rounded(4).bg(color))
      .child(div().text_size(12).font_medium().child(p.name))
      .child(div().text_size(10).text_color(on ? color : t.dim).child(String(count)));
  }

  render() {
    const t = theme();
    const p = PLATFORMS.find(x => x.id === this.platform) ?? PLATFORMS[0];
    const color = t[p.color];
    const ids = p.groups.flatMap(g => g.items.map(i => i.id));
    const anyOpen = ids.some(id => this.open.has(id));
    return v_flex().id("keybinds").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border)
      .text_color(t.foreground).text_size(13)
      // header
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().child("Keybinds"))
        .child(div().px(5).py(1).rounded(4).border_1().border_color(t.border).text_size(10).text_color(t.muted).child(`${ids.length} shortcuts`))
        .child(div().flex_1())
        .child(div().id("kb-expand").h(24).px(8).flex().items_center().rounded(6).cursor_pointer().text_size(11).text_color(t.muted)
          .hover(s => s.bg(t.hover).text_color(t.foreground))
          .on_click((_e, cx) => {
            for (const id of ids) { if (anyOpen) this.open.delete(id); else this.open.add(id); }
            this.save(); cx.notify();
          })
          .child(anyOpen ? "Collapse all" : "Expand all")))
      // platform switcher
      .child(v_flex().flex_none().px(10).pt(10).pb(8).gap(7).border_b(1).border_color(t.border)
        .child(h_flex().w_full().p(3).gap(3).rounded(8).bg(t.surface).border_1().border_color(t.border)
          .children(PLATFORMS.map(x => this.tab(x, t))))
        .child(h_flex().w_full().px(2).gap(6).items_center()
          .child(div().w(3).h(12).rounded(2).bg(color))
          .child(div().text_size(11).text_color(t.muted).child(p.blurb))))
      // list
      .child(div().flex_1().min_h(0).relative()
        .child(v_flex().id("kb-list").absolute().inset_0().overflow_y_scroll().px(6).pt(6).pb(12).gap(2)
          .children(p.groups.map((g, gi) => v_flex().id(`grp-${p.id}-${gi}`).w_full().flex_none().gap(1)
            .child(h_flex().w_full().px(8).pt(gi ? 12 : 6).pb(4).gap(6).items_center()
              .child(div().text_size(10.5).font_semibold().text_color(color).child(g.name.toUpperCase()))
              .child(div().flex_1().h(1).bg(t.border)))
            .children(g.items.map(item => this.row(item, t, color)))))
          .child(div().px(8).pt(14).text_size(10.5).text_color(t.dim)
            .child("Click any row for what it does. Herdr keys are Herdr's defaults; Hermes keys work in the Hermes chat.")))
        .child(Scrollbar.vertical("kb-list").absolute().inset_0()));
  }
}
