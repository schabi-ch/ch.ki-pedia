ALTER TABLE visitors
  ADD COLUMN url_ia_pedia_ch int(11) NOT NULL DEFAULT 0 AFTER url_ki_pedia_org,
  ADD COLUMN url_ia_pedia_org int(11) NOT NULL DEFAULT 0 AFTER url_ia_pedia_ch,
  ADD COLUMN url_ai_pedia_ch int(11) NOT NULL DEFAULT 0 AFTER url_ia_pedia_org;
