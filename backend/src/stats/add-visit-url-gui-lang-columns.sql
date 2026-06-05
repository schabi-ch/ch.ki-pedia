ALTER TABLE visitors
  ADD COLUMN url_ki_pedia_ch int(11) NOT NULL DEFAULT 0,
  ADD COLUMN url_ki_pedia_org int(11) NOT NULL DEFAULT 0,
  ADD COLUMN url_wikiped_ia_ch int(11) NOT NULL DEFAULT 0,
  ADD COLUMN url_wikiped_ia_org int(11) NOT NULL DEFAULT 0,
  ADD COLUMN gui_lang_de int(11) NOT NULL DEFAULT 0,
  ADD COLUMN gui_lang_fr int(11) NOT NULL DEFAULT 0,
  ADD COLUMN gui_lang_it int(11) NOT NULL DEFAULT 0,
  ADD COLUMN gui_lang_rm int(11) NOT NULL DEFAULT 0,
  ADD COLUMN gui_lang_en int(11) NOT NULL DEFAULT 0;