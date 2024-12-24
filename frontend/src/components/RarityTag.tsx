import { Tag } from "antd"
import React from "react";

type NFT = {
  id: number;
  owner?: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
  date_listed?: number;
};

interface RarityTagProps {
  nft: NFT
  style?: React.CSSProperties
}

const rarityColors: { [key: number]: string } = {
  1: "green",
  2: "blue",
  3: "purple",
  4: "orange",
};

const rarityLabels: { [key: number]: string } = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Super Rare",
};

const RarityTag: React.FC<RarityTagProps> = ({ nft, style }) => {
  return (
    <Tag
      color={rarityColors[nft.rarity]}
      style={{ fontSize: "14px", fontWeight: "bold", ...style }}
    >
      {rarityLabels[nft.rarity]}
    </Tag>
  )
}

export default RarityTag;