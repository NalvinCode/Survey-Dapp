import { Button, Alert, notification, Spin } from "antd";
import type { NotificationPlacement } from "antd/es/notification/interface";
import { ReactNode, useState, useEffect } from "react";
import useFetchSurvey from "./hooks/useFetchSurvey"
import React from "react";
import Web3 from "web3";

export default function Home() {
  //** STATES **//
  const [api, contextHolder] = notification.useNotification();
  const [account, setAccount] = useState("");
  const survey = useFetchSurvey();

  //** HOOKS **//
  useEffect(() => {
    const checkConnection = async () => {
      // Check if browser is running Metamask
      let web3: any;
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
      }
      // Check if User is already connected by retrieving the accounts
      web3.eth.getAccounts().then(async (address: string) => {
        setAccount(address[0] || "");
      });
    };
    checkConnection();
    useFetchSurvey();
  }, []);

  //** HANDLERS **//
  const handleConnectWallet = async () => {
    try {
      const network = window.ethereum;
      if (typeof network === "undefined" || !network.isMetaMask) {
        handleNotification(
          "topRight",
          "Error",
          <>
            Metamask is not intalled, please visit{" "}
            <a href="https://metamask.io/download/" target={"_blank"}>
              https://metamask.io/download/
            </a>{" "}
            and install metamask wallet
          </>
        );
        return;
      }
      const accounts = await network.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (e: any) {
      const errorCode = e.code;
      if (errorCode === 4001) {
        handleNotification(
          "topRight",
          "Warning",
          <>User rejected wallet connection</>
        );
      }
    }
  };

  const handleNotification = (
    placement: NotificationPlacement,
    title: string,
    message: ReactNode
  ) => {
    api.info({
      message: `${title}`,
      description: message,
      placement,
    });
  };

  //** APP **/
  if (account === "") {
    return (
      <div className="app-container">
        {contextHolder}
        <h1>Hi! Welcome to this survey</h1>
        <p>
          In order to start the survey, you have to connect your metamask wallet
        </p>
        <Button type="primary" onClick={handleConnectWallet}>
          Connect with Metamask
        </Button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {contextHolder}
      <h1></h1>
      <p>
        In order to start the survey, you have to connect your metamask wallet
      </p>
      <Button type="primary" onClick={handleConnectWallet}>
        Connect with Metamask
      </Button>
    </div>
  );
}
