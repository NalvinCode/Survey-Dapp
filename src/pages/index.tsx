import {
  Button,
  notification,
  Form,
  Radio,
  Space,
  Statistic,
  Card,
} from "antd";
import type { NotificationPlacement } from "antd/es/notification/interface";
import { ReactNode, useState, useEffect } from "react";
import React from "react";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import { AbiItem } from "web3-utils";
import tokenAbi from "../../public/tokenAbi.json";
import axios from "axios";

const { Countdown } = Statistic;

Contract.setProvider("https://rpc.ankr.com/eth_goerli");

const tokenContract = "0x437eF217203452317C3C955Cf282b1eE5F6aaF72";

export default function Home() {
  //** STATES **//
  const [api, contextHolder] = notification.useNotification();
  const [account, setAccount] = useState<string>("");
  const [network, setNetwork] = useState<number>();
  const [survey, setSurvey] = useState<any>();
  const [started, setStarted] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [answers, setAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const [quizBalance, setQuizBalance] = useState<number>(0);

  const [form] = Form.useForm();

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

    const getSurvey = async () => {
      const baseURL =
        (process.env.URL || "http://localhost:3000/") + "database/survey.json";
      const data = (await axios.get<any>(`${baseURL}`)).data;
      setSurvey(data);
    };
    getSurvey();
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
            ; and install metamask wallet
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

  const handleNetwork = async (chainId: number) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: Web3.utils.toHex(chainId) }],
      });
      setNetwork(chainId);
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainName: "Goerli Testnet",
              chainId: Web3.utils.toHex(chainId),
              nativeCurrency: { name: "QUIZ", decimals: 18, symbol: "QUIZ" },
              rpcUrls: ["https://rpc.ankr.com/eth_goerli"],
            },
          ],
        });
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

  const handleStart = () => {
    setStarted(true);
    handleGetBalance(account);
  };

  const handleSubmit = () => {
    const newAnswers = answers;
    newAnswers[questionCount] = {
      question: `${survey.questions[questionCount].text}`,
      answer: `${
        form.getFieldValue([`${survey.questions[questionCount].text}`])
          ? form.getFieldValue([`${survey.questions[questionCount].text}`]).text
          : ""
      }`,
    };
    setAnswers(newAnswers);
    setQuestionCount(questionCount + 1);
  };

  const handleGetBalance = async (walletAddress: string) => {
    const contract = new Contract(tokenAbi as AbiItem[], tokenContract);

    let result = await contract.methods.balanceOf(walletAddress).call();
    setQuizBalance(result);
  };

  const handleVerifyAnswers = async () => {
    const web3 = new Web3(window.ethereum);

    const answersIds = [
      answers.map((answer) => {
        return Math.floor(Math.random() * answers.length);
      }),
    ];

    var contract = new Contract(tokenAbi as AbiItem[], tokenContract);

    const tx = {
      from: account,
      to: tokenContract,
      gas: 50000,
      data: contract.methods
        .submit(Math.floor(Math.random() * 1000), answersIds)
        .encodeABI(),
    };

    web3.eth.sendTransaction(tx, () => {
      handleGetBalance(account);
      handleNotification("topRight", "success", <>Transaction Completed!</>);
    });

    handleGetBalance(account);
  };

  //** APP **/
  if (account === "" || network !== 5) {
    return (
      <div className="app-container">
        {contextHolder}
        <h1>Welcome to this survey</h1>
        <p>
          In order to start the survey, you have to connect your metamask wallet
          and switch network to goerli testnet
        </p>
        {account === "" && (
          <Button type="primary" onClick={handleConnectWallet}>
            Connect with metamask
          </Button>
        )}

        {account !== "" && network !== 5 && (
          <Button type="primary" onClick={() => handleNetwork(5)}>
            Connect to Goerli testnet
          </Button>
        )}
      </div>
    );
  }

  if (questionCount === survey.questions.length) {
    return (
      <div className="app-container">
        <div>
          <p>QUIZ TOKENS:{quizBalance}</p>
        </div>
        <div
          style={{
            maxHeight: "30%",
            overflow: "auto",
            padding: "5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {answers.map((answer) => {
            return (
              <Card
                title={`${answer.question}`}
                style={{ width: 300 }}
                key={answers.indexOf(answer)}
              >
                <p>{answer.answer}</p>
              </Card>
            );
          })}
        </div>

        <Button type="primary" onClick={handleVerifyAnswers}>
          Verify your answers!
        </Button>
      </div>
    );
  }

  return (
    <div>
      {!started && (
        <div className="app-container">
          {contextHolder}
          <h1>{survey.title}</h1>
          <img
            src={survey.image}
            style={{ width: "10rem", height: "10rem" }}
            alt=""
          />
          <Button type="primary" onClick={() => handleStart()}>
            Start the survey!
          </Button>
        </div>
      )}

      {started && (
        <div className="app-container">
          <div>
            <p>QUIZ TOKENS:{quizBalance}</p>
          </div>
          <Countdown
            value={
              Date.now() +
              (survey.questions[questionCount].lifetimeSeconds * 1000 + 1000)
            }
            onFinish={handleSubmit}
            format="mm:ss"
          />
          <h1>{survey.questions[questionCount].text}</h1>
          <img
            src={`${survey.questions[questionCount].image}`}
            style={{ height: "10rem", width: "10rem" }}
            alt=""
          />
          <Form
            onFinish={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Form.Item>
              <Radio.Group>
                <Space direction="vertical">
                  {survey.questions[questionCount].options.map(
                    (option: { text: string }) => {
                      return (
                        <Radio
                          key={survey.questions[questionCount].options.indexOf(
                            option
                          )}
                          value={option}
                          onChange={(event) => {
                            form.setFieldsValue({
                              [survey.questions[questionCount].text]:
                                event.target.value,
                            });
                          }}
                        >
                          {option.text}
                        </Radio>
                      );
                    }
                  )}
                </Space>
              </Radio.Group>
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}
