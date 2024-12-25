import React, { useEffect, useState, useCallback, lazy } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import RarityTag from "../components/RarityTag";

const Modal = lazy(() => import("antd/lib/modal/Modal"));

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient(process.env.REACT_APP_APTOS_URL!);

type NFT = {
  id: number;
  name: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: boolean;
};

const MyNFTs: React.FC = () => {
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();

  const [isModalVisible, setIsModalVisible] = useState<string>("");
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [salePrice, setSalePrice] = useState<string>("");
  const [recipientAddr, setRecipientAddr] = useState<string>("");

  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
      console.log("Fetching NFT IDs for owner:", account.address);

      const nftIdsResponse = await client.view({
        function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::get_all_nfts_for_owner`,
        arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, account.address, "100", "0"],
        type_arguments: [],
      });

      const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
      setTotalNFTs(nftIds.length);

      if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
      }

      console.log("Fetching details for each NFT ID:", nftIds);

      const userNFTs = (await Promise.all(
        nftIds.map(async (id) => {
          try {
            const nftDetails = await client.view({
              function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::get_nft_details`,
              arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, id],
              type_arguments: [],
            });

            const [nftId, _, name, description, uri, price, forSale, rarity] = nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              boolean,
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
            };
          } catch (error) {
            console.error(`Error fetching details for NFT ID ${id}:`, error);
            return null;
          }
        })
      )).filter((nft): nft is NFT => nft !== null);

      console.log("User NFTs:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }
  }, [account]);

  const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible("sell");
  };

  const handleTransferClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible("transfer");
  };

  const handleCancel = () => {
    setIsModalVisible("");
    setSelectedNft(null);
    setSalePrice("");
    setRecipientAddr("");
  };

  const handleConfirmListing = async () => {
    if (!selectedNft || !salePrice) return;
  
    try {
      const priceInOctas = parseFloat(salePrice) * 100000000;
  
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::list_for_sale`,
        type_arguments: [],
        arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, selectedNft.id.toString(), priceInOctas.toFixed(0).toString()],
      };
  
      // Bypass type checking
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT listed for sale successfully!");
      setIsModalVisible("");
      setSalePrice("");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error listing NFT for sale:", error);
      message.error("Failed to list NFT for sale.");
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedNft || !recipientAddr) return;
  
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${process.env.REACT_APP_MARKETPLACE_ADDR}::${process.env.REACT_APP_MARKETPLACE_CONTRACT_NAME}::transfer_ownership`,
        type_arguments: [],
        arguments: [process.env.REACT_APP_MARKETPLACE_ADDR, selectedNft.id.toString(), recipientAddr],
      };
  
      // Bypass type checking
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);
  
      message.success("NFT transferred successfully!");
      setIsModalVisible("");
      setRecipientAddr("");
      fetchUserNFTs();
    } catch (error) {
      console.error("Error transferring NFT:", error);
      message.error("Failed to transfer NFT.");
    }
  };

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs]);

  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      <Title level={2} style={{ marginBottom: "20px" }}>My Collection</Title>
      <p>Your personal collection of NFTs.</p>
  
      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          flex: 1
        }}
      >
        {paginatedNFTs.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={8} xl={6}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Card
              hoverable
              style={{
                width: "100%",
                maxWidth: "280px", // Increase max width to improve spacing
                minWidth: "220px",  // Increase minimum width to prevent stacking
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
              }}
              cover={<img alt={nft.name} src={nft.uri} />}
              bodyStyle={{ flex: 1 }}
              actions={[
                <Button type="link" onClick={() => handleSellClick(nft)} disabled={nft.for_sale}>
                  Sell
                </Button>,
                <Button type="link" onClick={() => handleTransferClick(nft)} disabled={nft.for_sale}>
                  Transfer
                </Button>
              ]}
            >
              <RarityTag nft={nft} style={{ marginBottom: "10px" }} />
              <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
              <p>ID: {nft.id}</p>
              <p>{nft.description}</p>
              <p style={{ margin: "10px 0" }}>For Sale: {nft.for_sale ? "Yes" : "No"}</p>
            </Card>
          </Col>
        ))}
      </Row>
  
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
  
      <Modal
        title="Sell NFT"
        open={isModalVisible === "sell"}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmListing}>
            Confirm Listing
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p><strong>NFT ID:</strong> {selectedNft.id}</p>
            <p><strong>Name:</strong> {selectedNft.name}</p>
            <p><strong>Description:</strong> {selectedNft.description}</p>
            <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
            <p><strong>Current Price:</strong> {selectedNft.price} APT</p>
  
            <Input
              type="number"
              placeholder="Enter sale price in APT"
              min={0.001}
              max={100}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </>
        )}
      </Modal>

      <Modal
        title="Transfer NFT"
        open={isModalVisible === "transfer"}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmTransfer}>
            Confirm Transfer
          </Button>,
        ]}
      >
        {
          selectedNft && (
            <>
              <p><strong>NFT ID:</strong> {selectedNft.id}</p>
              <p><strong>Name:</strong> {selectedNft.name}</p>
              <p><strong>Description:</strong> {selectedNft.description}</p>
              <p><strong>Rarity:</strong> {selectedNft.rarity}</p>
    
              <Input
                placeholder="Enter recipient Address"
                value={recipientAddr}
                onChange={(e) => setRecipientAddr(e.target.value)}
                style={{ marginTop: 10 }}
              />
            </>
          )
        }
      </Modal>
    </div>
  );  
};

export default MyNFTs;