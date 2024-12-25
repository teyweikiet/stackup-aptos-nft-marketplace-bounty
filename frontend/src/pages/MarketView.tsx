import React, { useState, useEffect, useMemo, lazy } from "react";
import { Typography, message, Card, Row, Col, Pagination, Button, Select, Space } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import RarityTag from "../components/RarityTag";
import PriceSlider from "../components/PriceSlider";

const Modal = lazy(() => import("antd/lib/modal/Modal"));

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient(process.env.REACT_APP_APTOS_URL!);

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
  date_listed: number;
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const MarketView: React.FC = () => {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [sortOption, setSortOption] = useState<string>('date_listed:desc');
  const [priceRange, setPriceRange] = useState<number[]>([0.001, 100]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

  const nftsToDisplay = useMemo(() => {
    const [minPrice, maxPrice] = priceRange;

    let _nftsToDisplay = [...nfts]
      .filter(nft => {
        if (nft.price < minPrice || nft.price > maxPrice)
          return false;
        if (rarity && rarity !== 'all')
          return nft.rarity === rarity;
        return true;
      });
    
    switch (sortOption) {
      case 'date_listed:desc':
        return _nftsToDisplay.sort((a, b) => b.date_listed - a.date_listed);
      case 'id:desc':
        return _nftsToDisplay.sort((a, b) => b.id - a.id);
      case 'price:asc':
        return _nftsToDisplay.sort((a, b) => a.price - b.price);
      case 'price:desc':
        return _nftsToDisplay.sort((a, b) => b.price - a.price);
      default:
        return _nftsToDisplay;
    }
  }, [rarity, nfts, sortOption, priceRange]);

  const handleFetchNfts = async () => {
    try {
      const nftIdsResponse = await client.view({
        function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::get_all_nfts_for_sale`,
        arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, "100", "0"],
        type_arguments: [],
      });
      const nftIds = (Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse).map(({ id }) => id);

      if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
      }

      const nftsForSale = (await Promise.all(
        nftIds.map(async (id) => {
          try {
            const nftDetails = await client.view({
              function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::get_nft_details`,
              arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, id],
              type_arguments: [],
            });

            const [nftId, owner, name, description, uri, price, forSale, rarity, dateListed] = nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              boolean,
              number,
              number
            ];

            const hexToUint8Array = (hexString: string): Uint8Array => {
              const bytes = new Uint8Array(hexString.length / 2);
              for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
              }
              return bytes;
            };

            return {
              id: nftId,
              name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
              description: new TextDecoder().decode(hexToUint8Array(description.slice(2))),
              uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
              rarity,
              price: price / 100000000, // Convert octas to APT
              for_sale: forSale,
              owner,
              date_listed: dateListed
            };
          } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null;
          }
        })
      )).filter((nft): nft is NFT => nft !== null);
      setNfts(nftsForSale);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching NFTs by rarity:", error);
      message.error("Failed to fetch NFTs.");
    }
  };

  useEffect(() => {
    handleFetchNfts();
  }, [handleFetchNfts]);

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

  const handleCancelBuy = () => {
    setIsBuyModalVisible(false);
    setSelectedNft(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedNft) return;
  
    try {
      const priceInOctas = selectedNft.price * 100000000;
  
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::purchase_nft`,
        type_arguments: [],
        arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, selectedNft.id.toString(), priceInOctas.toString()],
      };
  
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT purchased successfully!");
      setIsBuyModalVisible(false);
      handleFetchNfts(); // Refresh NFT list
      console.log("signAndSubmitTransaction:", signAndSubmitTransaction);
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      message.error("Failed to purchase NFT.");
    }
  };

  const paginatedNfts = nftsToDisplay.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      style={{  
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)", // Subtract header height from 100vh",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
  
      {/* Filter & Sort Buttons */}
      <Space
        style={{
          marginBottom: "20px",
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Select
          style={{ width: '160px' }}
          prefix="Rarity"
          defaultValue="all"
          options={[
            { value: "all", label: 'All' },
            { value: 1, label: 'Common' },
            { value: 2, label: 'Uncommon' },
            { value: 3, label: 'Rare' },
            { value: 4, label: 'Super Rare' },
          ]}
          onChange={(value: "all" | number) => {
            setRarity(value);
          }}
        />

        <PriceSlider onChangeComplete={setPriceRange} />

        <Select
          style={{ width: '225px' }}
          prefix="Sort by"
          defaultValue="date_listed:desc"
          options={[
            { value: 'date_listed:desc', label: 'Last Listed' },
            { value: 'id:desc', label: 'Last Minted' },
            { value: 'price:asc', label: 'Price: Low to High' },
            { value: 'price:desc', label: 'Price: High to Low' },
          ]}
          onChange={(value: string) => {
            setSortOption(value);
          }}
        />
      </Space>
  
      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          display: "flex",
          justifyContent: "center", // Center row content
          flexWrap: "wrap",
          flex: 1
        }}
      >
        {paginatedNfts.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={6} xl={6}
            style={{
              display: "flex",
              justifyContent: "center", // Center the single card horizontally
              alignItems: "center", // Center content in both directions
            }}
          >
            <Card
              hoverable
              style={{
                height: "100%",
                width: "100%", // Make the card responsive
                maxWidth: "240px", // Limit the card width on larger screens
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
              }}
              cover={<img alt={nft.name} src={nft.uri} />}
              bodyStyle={{ flex: 1 }}
              actions={[
                <Button type="link" onClick={() => handleBuyClick(nft)}>
                  Buy
                </Button>
              ]}
            >
              {/* Rarity Tag */}
              <RarityTag nft={nft} style={{ marginBottom: 10 }} />
  
              <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
              <p>{nft.description}</p>
              <p>ID: {nft.id}</p>
              <p>Owner: {truncateAddress(nft.owner)}</p>
            </Card>
          </Col>
        ))}
      </Row>
  
      {/* Pagination */}
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={nftsToDisplay.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
  
      {/* Buy Modal */}
      <Modal
        title="Purchase NFT"
        open={isBuyModalVisible}
        onCancel={handleCancelBuy}
        footer={[
          <Button key="cancel" onClick={handleCancelBuy}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
            Confirm Purchase
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p><strong>NFT ID:</strong> {selectedNft.id}</p>
            <p><strong>Name:</strong> {selectedNft.name}</p>
            <p><strong>Description:</strong> {selectedNft.description}</p>
            <p><strong>Rarity:</strong> <RarityTag nft={selectedNft} /></p>
            <p><strong>Price:</strong> {selectedNft.price} APT</p>
            <p><strong>Owner:</strong> {truncateAddress(selectedNft.owner)}</p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MarketView;