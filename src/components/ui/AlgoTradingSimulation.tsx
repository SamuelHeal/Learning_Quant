"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUp, FiArrowDown, FiInfo, FiX } from "react-icons/fi";

// Update the Trade type to include profit information
type Trade = {
  id: string; // Unique identifier for each trade
  type: "buy" | "sell";
  price: number;
  size: number;
  timestamp: number;
  zscore: number;
  realizedProfit: number; // Profit/loss realized when position is closed
  unrealizedProfit: number; // Current profit/loss for open positions
  isExit: boolean; // Whether this is an exit trade
  remainingSize: number; // Remaining open position size (for entry trades)
};

// Type for tracking open positions
type OpenPosition = {
  tradeId: string; // ID of the trade that opened this position
  type: "buy" | "sell";
  price: number;
  size: number;
  timestamp: number;
};

// Add a new type for trade updates
type TradeUpdate = {
  id: string;
  sizeToClose: number;
  realizedProfit: number;
};

export default function AlgoTradingSimulation() {
  // Add type for buy/sell points to include price and action type
  type TradePoint = {
    index: number;
    price: number;
    size: number; // Position size for the trade
    timestamp: number; // For animation timing
  };

  const [buyPoints, setBuyPoints] = useState<TradePoint[]>([]);
  const [sellPoints, setSellPoints] = useState<TradePoint[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [profit, setProfit] = useState<number>(0);
  const [positions, setPositions] = useState<number>(0);
  const [strategyName, setStrategyName] = useState<string>(
    "Statistical Arbitrage"
  );
  const [zscore, setZscore] = useState<number>(0);
  const [volatility, setVolatility] = useState<number>(0);
  const [lastTradeTimestamp, setLastTradeTimestamp] = useState<number>(0);
  const [showStrategyModal, setShowStrategyModal] = useState<boolean>(false);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update the useEffect for initializing dimensions with a resize handler
  useEffect(() => {
    const initialPrices = generatePrices(40);
    setPrices(initialPrices);

    // Calculate initial volatility
    const initialVol = calculateVolatility(initialPrices, 10);
    setVolatility(initialVol);

    // Set canvas dimensions after mount
    if (canvasRef.current) {
      setDimensions({
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
      });
    }
  }, []);

  // Replace with improved initialization that includes a resize handler
  useEffect(() => {
    const initialPrices = generatePrices(40);
    setPrices(initialPrices);

    // Calculate initial volatility
    const initialVol = calculateVolatility(initialPrices, 10);
    setVolatility(initialVol);

    // Set initial dimensions
    const updateDimensions = () => {
      if (canvasRef.current) {
        setDimensions({
          width: canvasRef.current.clientWidth || 300, // Fallback width if calculation fails
          height: canvasRef.current.clientHeight || 400, // Fallback height if calculation fails
        });
      }
    };

    // Set dimensions immediately
    updateDimensions();

    // Add resize listener to handle orientation changes and window resizing
    window.addEventListener("resize", updateDimensions);

    // Clean up listener on component unmount
    return () => {
      window.addEventListener("resize", updateDimensions);
    };
  }, []);

  // Generate a unique ID for each trade
  const generateTradeId = () => {
    return `trade-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Update the trading simulation effect
  useEffect(() => {
    if (prices.length === 0) return;

    // Run the trading algorithm every second
    const interval = setInterval(() => {
      // Add a new price point
      const newPrice = generateNextPrice(prices[prices.length - 1]);
      const newPrices = [...prices.slice(1), newPrice];
      setPrices(newPrices);

      // Update volatility
      const newVol = calculateVolatility(newPrices, 10);
      setVolatility(newVol);

      // Advanced proprietary trading strategy: Statistical Arbitrage with Mean Reversion
      // Using z-score to detect deviations from equilibrium and volatility-adjusted position sizing

      // Calculate z-score (how many standard deviations away from the mean)
      const mean = calculateSMA(newPrices, 20);
      const stdDev = calculateStdDev(newPrices, 20);
      const currentZscore = (newPrice - mean) / (stdDev || 1); // Avoid division by zero
      setZscore(currentZscore);

      // Current price and position info
      const lastPrice = newPrices[newPrices.length - 1];

      // Signal generation with dynamic thresholds based on volatility
      const entryThreshold = 1.5 + volatility * 0.5; // Higher volatility = higher threshold
      const exitThreshold = 0.5;

      // Get optimal position size based on z-score and volatility
      const optimalPositionSize = calculateOptimalPositionSize(
        currentZscore,
        volatility
      );

      // Current timestamp for animations
      const timestamp = Date.now();

      // Update existing trade points - decrement their indices as we've removed the oldest point
      const updatedBuyPoints = buyPoints
        .map((point) => ({
          ...point,
          index: point.index - 1,
        }))
        .filter((point) => point.index >= 0);

      const updatedSellPoints = sellPoints
        .map((point) => ({
          ...point,
          index: point.index - 1,
        }))
        .filter((point) => point.index >= 0);

      // Update unrealized profit for trades that still have open positions
      let totalUnrealizedProfit = 0;

      setRecentTrades((prevTrades) => {
        const updatedTrades = prevTrades.map((trade) => {
          // Skip exit trades
          if (trade.isExit) return trade;

          // Skip trades with no remaining position or with realized profit (closed positions)
          if (trade.remainingSize <= 0) {
            // Make sure unrealized profit is zero for fully closed positions
            if (trade.unrealizedProfit !== 0) {
              return {
                ...trade,
                unrealizedProfit: 0,
              };
            }
            return trade;
          }

          // Calculate unrealized profit based on current price
          let unrealizedProfit = 0;
          if (trade.type === "buy") {
            // For buy trades, profit = current price - entry price
            unrealizedProfit = (lastPrice - trade.price) * trade.remainingSize;
          } else {
            // For sell trades, profit = entry price - current price
            unrealizedProfit = (trade.price - lastPrice) * trade.remainingSize;
          }

          unrealizedProfit = Math.round(unrealizedProfit * 100) / 100;
          totalUnrealizedProfit += unrealizedProfit;

          return {
            ...trade,
            unrealizedProfit,
          };
        });

        return updatedTrades;
      });

      // Calculate total realized profit from all trades
      const totalRealizedProfit = recentTrades.reduce(
        (total, trade) => total + (trade.realizedProfit || 0),
        0
      );

      // Update total profit with both realized and unrealized components
      setProfit(
        Math.round((totalRealizedProfit + totalUnrealizedProfit) * 100) / 100
      );

      // Mean reversion trading logic
      if (currentZscore < -entryThreshold && positions < 3) {
        // Strong negative deviation - BUY signal (expect reversion up)
        const newBuyPoint = {
          index: newPrices.length - 1,
          price: lastPrice,
          size: optimalPositionSize,
          timestamp,
        };
        updatedBuyPoints.push(newBuyPoint);
        setLastTradeTimestamp(timestamp);

        // Create new trade with unique ID
        const tradeId = generateTradeId();
        const newTrade: Trade = {
          id: tradeId,
          type: "buy",
          price: lastPrice,
          size: optimalPositionSize,
          timestamp,
          zscore: currentZscore,
          realizedProfit: 0, // No realized profit for entry positions
          unrealizedProfit: 0, // Initial unrealized profit is 0
          isExit: false,
          remainingSize: optimalPositionSize, // Initially, full size is open
        };
        setRecentTrades((prev) => [newTrade, ...prev]);

        // Add to open positions
        setOpenPositions((prev) => [
          ...prev,
          {
            tradeId,
            type: "buy",
            price: lastPrice,
            size: optimalPositionSize,
            timestamp,
          },
        ]);

        // Increase position (buy more when price is lower)
        const newPositions = Math.min(3, positions + optimalPositionSize);
        setPositions(newPositions);

        // No direct profit update here - profit is updated by the unrealized/realized calculations
      } else if (currentZscore > entryThreshold && positions > -3) {
        // Strong positive deviation - SELL signal (expect reversion down)
        const newSellPoint = {
          index: newPrices.length - 1,
          price: lastPrice,
          size: optimalPositionSize,
          timestamp,
        };
        updatedSellPoints.push(newSellPoint);
        setLastTradeTimestamp(timestamp);

        // Create new trade with unique ID
        const tradeId = generateTradeId();
        const newTrade: Trade = {
          id: tradeId,
          type: "sell",
          price: lastPrice,
          size: optimalPositionSize,
          timestamp,
          zscore: currentZscore,
          realizedProfit: 0, // No realized profit for entry positions
          unrealizedProfit: 0, // Initial unrealized profit is 0
          isExit: false,
          remainingSize: optimalPositionSize, // Initially, full size is open
        };
        setRecentTrades((prev) => [newTrade, ...prev]);

        // Add to open positions
        setOpenPositions((prev) => [
          ...prev,
          {
            tradeId,
            type: "sell",
            price: lastPrice,
            size: optimalPositionSize,
            timestamp,
          },
        ]);

        // Decrease position (sell more when price is higher)
        const newPositions = Math.max(-3, positions - optimalPositionSize);
        setPositions(newPositions);

        // No direct profit update here - profit is updated by the unrealized/realized calculations
      }
      // Mean reversion exit logic - exit positions as z-score returns to mean
      else if (Math.abs(currentZscore) < exitThreshold && positions !== 0) {
        // Price reverting to mean - exit position
        if (positions > 0) {
          // Exit long position (sell)
          const newSellPoint = {
            index: newPrices.length - 1,
            price: lastPrice,
            size: positions,
            timestamp,
          };
          updatedSellPoints.push(newSellPoint);
          setLastTradeTimestamp(timestamp);

          // Find buy positions to close (FIFO - First In, First Out)
          let remainingToClose = positions;
          let realizedProfitTotal = 0;

          // Create a new array of open positions that will exclude closed ones
          const updatedOpenPositions = [...openPositions];

          // Process open positions in order (oldest first)
          const buyPositions = updatedOpenPositions
            .filter((pos) => pos.type === "buy")
            .sort((a, b) => a.timestamp - b.timestamp);

          // Store the IDs of trades that need updating
          const tradeIdsToUpdate: TradeUpdate[] = [];

          // First pass: Calculate realized profit and identify positions to close
          for (
            let i = 0;
            i < buyPositions.length && remainingToClose > 0;
            i++
          ) {
            const position = buyPositions[i];
            const sizeToClose = Math.min(position.size, remainingToClose);

            // Track this trade for updating
            tradeIdsToUpdate.push({
              id: position.tradeId,
              sizeToClose,
              realizedProfit: (lastPrice - position.price) * sizeToClose,
            });

            realizedProfitTotal += (lastPrice - position.price) * sizeToClose;
            remainingToClose -= sizeToClose;
          }

          // Update trades with realized profit
          setRecentTrades((prev) => {
            // Create a copy we can modify
            const updatedTrades = [...prev];

            // Update each entry trade that was affected
            for (const update of tradeIdsToUpdate) {
              const tradeIndex = updatedTrades.findIndex(
                (trade) => trade.id === update.id
              );

              if (tradeIndex !== -1) {
                const trade = updatedTrades[tradeIndex];
                const newRemainingSize =
                  trade.remainingSize - update.sizeToClose;

                // Update the trade
                updatedTrades[tradeIndex] = {
                  ...trade,
                  realizedProfit:
                    Math.round(
                      (trade.realizedProfit + update.realizedProfit) * 100
                    ) / 100,
                  remainingSize: newRemainingSize,
                  // Zero out unrealized profit if position is fully closed
                  unrealizedProfit:
                    newRemainingSize > 0
                      ? (lastPrice - trade.price) * newRemainingSize
                      : 0,
                };
              }
            }

            // Remove fully closed positions from openPositions
            for (let i = updatedOpenPositions.length - 1; i >= 0; i--) {
              const position = updatedOpenPositions[i];
              if (position.type === "buy") {
                const update = tradeIdsToUpdate.find(
                  (u) => u.id === position.tradeId
                );
                if (update) {
                  if (update.sizeToClose >= position.size) {
                    // Remove the position if it's fully closed
                    updatedOpenPositions.splice(i, 1);
                  } else {
                    // Update the position size if partially closed
                    updatedOpenPositions[i] = {
                      ...position,
                      size: position.size - update.sizeToClose,
                    };
                  }
                }
              }
            }

            // Add the exit trade
            const exitTradeId = generateTradeId();
            const exitTrade: Trade = {
              id: exitTradeId,
              type: "sell",
              price: lastPrice,
              size: positions, // Total size being exited
              timestamp,
              zscore: currentZscore,
              realizedProfit: 0, // Exit trades don't show profit
              unrealizedProfit: 0,
              isExit: true,
              remainingSize: 0,
            };

            return [exitTrade, ...updatedTrades];
          });

          // Update open positions state
          setOpenPositions(updatedOpenPositions);

          // Note: We don't directly update P&L here, as it will be updated by the consolidated calculation above
        } else {
          // Exit short position (buy)
          const newBuyPoint = {
            index: newPrices.length - 1,
            price: lastPrice,
            size: Math.abs(positions),
            timestamp,
          };
          updatedBuyPoints.push(newBuyPoint);
          setLastTradeTimestamp(timestamp);

          // Find sell positions to close (FIFO - First In, First Out)
          let remainingToClose = Math.abs(positions);
          let realizedProfitTotal = 0;

          // Create a new array of open positions that will exclude closed ones
          const updatedOpenPositions = [...openPositions];

          // Process open positions in order (oldest first)
          const sellPositions = updatedOpenPositions
            .filter((pos) => pos.type === "sell")
            .sort((a, b) => a.timestamp - b.timestamp);

          // Store the IDs of trades that need updating
          const tradeIdsToUpdate: TradeUpdate[] = [];

          // First pass: Calculate realized profit and identify positions to close
          for (
            let i = 0;
            i < sellPositions.length && remainingToClose > 0;
            i++
          ) {
            const position = sellPositions[i];
            const sizeToClose = Math.min(position.size, remainingToClose);

            // Track this trade for updating
            tradeIdsToUpdate.push({
              id: position.tradeId,
              sizeToClose,
              realizedProfit: (position.price - lastPrice) * sizeToClose,
            });

            realizedProfitTotal += (position.price - lastPrice) * sizeToClose;
            remainingToClose -= sizeToClose;
          }

          // Update trades with realized profit
          setRecentTrades((prev) => {
            // Create a copy we can modify
            const updatedTrades = [...prev];

            // Update each entry trade that was affected
            for (const update of tradeIdsToUpdate) {
              const tradeIndex = updatedTrades.findIndex(
                (trade) => trade.id === update.id
              );

              if (tradeIndex !== -1) {
                const trade = updatedTrades[tradeIndex];
                const newRemainingSize =
                  trade.remainingSize - update.sizeToClose;

                // Update the trade
                updatedTrades[tradeIndex] = {
                  ...trade,
                  realizedProfit:
                    Math.round(
                      (trade.realizedProfit + update.realizedProfit) * 100
                    ) / 100,
                  remainingSize: newRemainingSize,
                  // Zero out unrealized profit if position is fully closed
                  unrealizedProfit:
                    newRemainingSize > 0
                      ? (trade.price - lastPrice) * newRemainingSize
                      : 0,
                };
              }
            }

            // Remove fully closed positions from openPositions
            for (let i = updatedOpenPositions.length - 1; i >= 0; i--) {
              const position = updatedOpenPositions[i];
              if (position.type === "sell") {
                const update = tradeIdsToUpdate.find(
                  (u) => u.id === position.tradeId
                );
                if (update) {
                  if (update.sizeToClose >= position.size) {
                    // Remove the position if it's fully closed
                    updatedOpenPositions.splice(i, 1);
                  } else {
                    // Update the position size if partially closed
                    updatedOpenPositions[i] = {
                      ...position,
                      size: position.size - update.sizeToClose,
                    };
                  }
                }
              }
            }

            // Add the exit trade
            const exitTradeId = generateTradeId();
            const exitTrade: Trade = {
              id: exitTradeId,
              type: "buy",
              price: lastPrice,
              size: Math.abs(positions), // Total size being exited
              timestamp,
              zscore: currentZscore,
              realizedProfit: 0, // Exit trades don't show profit
              unrealizedProfit: 0,
              isExit: true,
              remainingSize: 0,
            };

            return [exitTrade, ...updatedTrades];
          });

          // Update open positions state
          setOpenPositions(updatedOpenPositions);

          // Note: We don't directly update P&L here, as it will be updated by the consolidated calculation above
        }

        // Reset position
        setPositions(0);
      }

      // Update buy/sell points
      setBuyPoints(updatedBuyPoints);
      setSellPoints(updatedSellPoints);
    }, 1000);

    return () => clearInterval(interval);
  }, [prices, volatility, positions, openPositions, recentTrades]);

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
  };

  // Helper functions
  const generatePrices = (count: number): number[] => {
    const prices: number[] = [];
    let price = 100; // Starting price

    for (let i = 0; i < count; i++) {
      price = generateNextPrice(price);
      prices.push(price);
    }

    return prices;
  };

  const generateNextPrice = (lastPrice: number): number => {
    // More sophisticated price model with stochastic volatility
    // Adding random jumps to simulate market surprises

    const jumpProbability = 0.05; // 5% chance of a jump
    const isJump = Math.random() < jumpProbability;

    let change;
    if (isJump) {
      // Large market move
      change = (Math.random() - 0.5) * 10;
    } else {
      // Normal price movement with volatility clustering
      const volFactor = 1 + (volatility > 2 ? 1 : 0); // Increase volatility when already high
      change = (Math.random() - 0.5) * 3 * volFactor;
    }

    // Mean reversion component (pulls price back to 100)
    const meanReversion = (100 - lastPrice) * 0.03;
    const newPrice = lastPrice + change + meanReversion;

    return Math.max(50, Math.min(150, newPrice)); // Keep within bounds
  };

  const calculateSMA = (prices: number[], window: number): number => {
    if (prices.length < window) return 0;
    const sum = prices.slice(-window).reduce((acc, price) => acc + price, 0);
    return sum / window;
  };

  const calculateStdDev = (prices: number[], window: number): number => {
    if (prices.length < window) return 0;
    const windowPrices = prices.slice(-window);
    const mean = windowPrices.reduce((acc, price) => acc + price, 0) / window;
    const squaredDiffs = windowPrices.map((price) => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((acc, diff) => acc + diff, 0) / window;
    return Math.sqrt(variance);
  };

  const calculateVolatility = (prices: number[], window: number): number => {
    if (prices.length < window) return 0;

    // Calculate percentage changes
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    // Use only the last 'window' returns
    const windowReturns = returns.slice(-window);

    // Standard deviation of returns = realized volatility
    const mean =
      windowReturns.reduce((acc, ret) => acc + ret, 0) / windowReturns.length;
    const squaredDiffs = windowReturns.map((ret) => Math.pow(ret - mean, 2));
    const variance =
      squaredDiffs.reduce((acc, diff) => acc + diff, 0) / windowReturns.length;

    // Annualize volatility (assuming daily data, multiply by sqrt(252))
    // For this simulation, we'll scale it to make it more visible
    return Math.sqrt(variance) * 100;
  };

  const calculateOptimalPositionSize = (
    zscore: number,
    volatility: number
  ): number => {
    // Position sizing based on Kelly Criterion concept (simplified)
    // Higher conviction (extreme z-score) = larger position
    // Higher volatility = smaller position

    const zscoreImpact = Math.min(1, Math.abs(zscore) / 4);
    const volImpact = Math.max(0.1, 1 - volatility / 20);

    // Base size between 0 and 1
    const size = zscoreImpact * volImpact;

    // Discretize to 0.5 units for simplicity
    return Math.ceil(size * 2) / 2;
  };

  // Calculate positions for rendering
  const getY = (price: number): number => {
    const min = 50;
    const max = 150;
    const height = dimensions.height - 40; // Subtract padding
    return height - ((price - min) / (max - min)) * height + 20; // Add padding
  };

  // Convert prices to SVG path
  const getPath = (): string => {
    if (prices.length === 0 || dimensions.width === 0) return "";

    const stepX = dimensions.width / (prices.length - 1);

    return prices
      .map((price, i) => {
        const x = i * stepX;
        const y = getY(price);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Calculate animation status - show pulse effect for recent trades
  const getAnimationStatus = (timestamp: number) => {
    const isRecent = Date.now() - timestamp < 2000; // 2 seconds
    return isRecent;
  };

  return (
    <div
      className="w-full h-full min-h-[500px] sm:min-h-[450px] md:min-h-[400px] bg-background brutalist-border overflow-hidden relative"
      ref={canvasRef}
    >
      {/* Always render UI elements, only conditionally render SVG path */}
      <svg className="w-full h-full sm:h-[100% - 150px]">
        {/* Mean line */}
        <line
          x1={0}
          y1={dimensions.height ? getY(100) : 200} // Fallback if dimensions not set
          x2={dimensions.width || 300}
          y2={dimensions.height ? getY(100) : 200}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Chart line - only render if dimensions are available */}
        {dimensions.width > 0 && prices.length > 0 && (
          <path
            d={getPath()}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="3"
            strokeLinecap="square"
          />
        )}

        {/* Conditionally render points only if dimensions are available */}
        {dimensions.width > 0 && (
          <>
            {/* Buy points */}
            {buyPoints.map((point, i) => {
              if (point.index >= prices.length) return null;
              const x = point.index * (dimensions.width / (prices.length - 1));
              const y = getY(prices[point.index]);
              const isRecent = getAnimationStatus(point.timestamp);

              return (
                <g key={`buy-${i}-${point.timestamp}`}>
                  {/* Circle marker */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={6 + point.size * 2} // Size based on position size
                    fill="none"
                    stroke="var(--foreground)"
                    strokeWidth={3}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  />

                  {/* Buy arrow and label */}
                  <motion.g
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <circle
                      cx={x}
                      cy={y - 25}
                      r={12}
                      fill="var(--foreground)"
                    />
                    <foreignObject x={x - 8} y={y - 33} width={16} height={16}>
                      <div className="flex items-center justify-center h-full">
                        <FiArrowUp color="var(--background)" size={12} />
                      </div>
                    </foreignObject>

                    {/* Size label */}
                    <text
                      x={x}
                      y={y + 25}
                      textAnchor="middle"
                      fill="var(--foreground)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      +{point.size}
                    </text>
                  </motion.g>
                </g>
              );
            })}

            {/* Sell points */}
            {sellPoints.map((point, i) => {
              if (point.index >= prices.length) return null;
              const x = point.index * (dimensions.width / (prices.length - 1));
              const y = getY(prices[point.index]);
              const isRecent = getAnimationStatus(point.timestamp);

              return (
                <g key={`sell-${i}-${point.timestamp}`}>
                  {/* Circle marker */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={6 + point.size * 2} // Size based on position size
                    fill="var(--foreground)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  />

                  {/* Sell arrow and label */}
                  <motion.g
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <circle
                      cx={x}
                      cy={y + 25}
                      r={12}
                      fill="var(--foreground)"
                    />
                    <foreignObject x={x - 8} y={y + 17} width={16} height={16}>
                      <div className="flex items-center justify-center h-full">
                        <FiArrowDown color="var(--background)" size={12} />
                      </div>
                    </foreignObject>

                    {/* Size label */}
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      fill="var(--foreground)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      -{point.size}
                    </text>
                  </motion.g>
                </g>
              );
            })}
          </>
        )}
      </svg>

      {/* Always render the UI elements */}
      {/* Flash effect on new trade */}
      {Date.now() - lastTradeTimestamp < 500 && (
        <motion.div
          className="absolute inset-0 bg-accent opacity-10"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Recent trades table */}
      <div className="absolute bottom-16 sm:bottom-12 md:bottom-10 inset-x-2 md:inset-x-4 brutalist-border bg-background bg-opacity-90 flex flex-col">
        {/* Fixed header */}
        <div className="w-full brutalist-border-b bg-background">
          <table className="w-full text-[10px] sm:text-xs font-mono">
            <thead>
              <tr>
                <th className="px-1 md:px-2 py-1 text-left w-[60px] md:w-[80px]">
                  Time
                </th>
                <th className="px-1 md:px-2 py-1 text-left w-[70px] md:w-[100px]">
                  Type
                </th>
                <th className="px-1 md:px-2 py-1 text-right w-[50px] md:w-[70px]">
                  Price
                </th>
                <th className="hidden sm:table-cell px-1 md:px-2 py-1 text-right w-[40px] md:w-[60px]">
                  Size
                </th>
                <th className="hidden sm:table-cell px-1 md:px-2 py-1 text-right w-[50px] md:w-[70px]">
                  Z-Score
                </th>
                <th className="px-1 md:px-2 py-1 text-right w-[70px] md:w-[100px]">
                  Realized P/L
                </th>
                <th className="px-1 md:px-2 py-1 text-right w-[70px] md:w-[100px]">
                  Unrealized P/L
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[70px] sm:max-h-[90px]">
          <table className="w-full text-[10px] sm:text-xs font-mono">
            <tbody>
              {recentTrades.map((trade, i) => (
                <motion.tr
                  key={`trade-${trade.timestamp}-${i}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={i === 0 ? "bg-muted bg-opacity-30" : ""}
                >
                  <td className="px-1 md:px-2 py-1 w-[60px] md:w-[80px]">
                    {formatTimestamp(trade.timestamp)}
                  </td>
                  <td className="px-1 md:px-2 py-1 w-[70px] md:w-[100px]">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        trade.type === "buy" ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {trade.type === "buy" ? (
                        <>
                          <FiArrowUp size={8} className="sm:hidden" />
                          <FiArrowUp
                            size={10}
                            className="hidden sm:block"
                          />{" "}
                          Buy
                        </>
                      ) : (
                        <>
                          <FiArrowDown size={8} className="sm:hidden" />
                          <FiArrowDown
                            size={10}
                            className="hidden sm:block"
                          />{" "}
                          Sell
                        </>
                      )}
                      {trade.isExit && " (Exit)"}
                    </span>
                  </td>
                  <td className="px-1 md:px-2 py-1 text-right w-[50px] md:w-[70px]">
                    ${trade.price.toFixed(2)}
                  </td>
                  <td className="hidden sm:table-cell px-1 md:px-2 py-1 text-right w-[40px] md:w-[60px]">
                    {trade.size.toFixed(1)}
                  </td>
                  <td className="hidden sm:table-cell px-1 md:px-2 py-1 text-right w-[50px] md:w-[70px]">
                    {trade.zscore.toFixed(2)}
                  </td>
                  <td
                    className={`px-1 md:px-2 py-1 text-right w-[70px] md:w-[100px] ${
                      trade.realizedProfit > 0
                        ? "text-green-600"
                        : trade.realizedProfit < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {trade.realizedProfit === 0
                      ? "-"
                      : `$${trade.realizedProfit.toFixed(2)}`}
                  </td>
                  <td
                    className={`px-1 md:px-2 py-1 text-right w-[70px] md:w-[100px] ${
                      trade.unrealizedProfit > 0
                        ? "text-green-600"
                        : trade.unrealizedProfit < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {!trade.isExit && trade.remainingSize > 0
                      ? `$${trade.unrealizedProfit.toFixed(2)}`
                      : "-"}
                  </td>
                </motion.tr>
              ))}
              {recentTrades.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-1 text-center text-muted-foreground"
                  >
                    No trades yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlay information */}
      <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex flex-wrap gap-2 z-10 justify-center sm:justify-start">
        <div className="brutalist-border px-2 py-1 text-xs md:text-sm font-mono">
          Price: $
          {prices.length > 0 ? prices[prices.length - 1].toFixed(2) : "0.00"}
        </div>

        <div className="brutalist-border px-2 py-1 text-xs md:text-sm font-mono">
          P&L: ${profit.toFixed(2)}
        </div>

        <div className="brutalist-border px-2 py-1 text-xs md:text-sm font-mono">
          Z-Score: {zscore.toFixed(2)}
        </div>

        <div className="brutalist-border px-2 py-1 text-xs md:text-sm font-mono">
          Vol: {volatility.toFixed(2)}
        </div>

        <div className="brutalist-border px-2 py-1 text-xs md:text-sm font-mono">
          Position: {positions.toFixed(1)}
        </div>
      </div>

      {/* Replace with responsive structure that stacks on mobile */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 md:left-4 right-2 md:right-4 text-[10px] sm:text-xs font-mono">
        <div className="flex flex-col sm:flex-row sm:justify-between w-full">
          {/* Buy/Sell Signal Key - Left side on all screens */}
          <div className="flex justify-center sm:justify-start mb-2 sm:mb-0">
            <div className="inline-block mr-4">
              <span className="inline-block w-2 h-2 md:w-3 md:h-3 mr-1 border-2 md:border-3 border-accent bg-transparent"></span>
              Buy Signal
            </div>
            <div className="inline-block">
              <span className="inline-block w-2 h-2 md:w-3 md:h-3 mr-1 bg-foreground"></span>
              Sell Signal
            </div>
          </div>

          {/* Strategy Info - centered on mobile, right side on larger screens */}
          <div className="flex items-center justify-center sm:justify-start gap-1 md:gap-2">
            <span>{strategyName}</span>
            <button
              onClick={() => setShowStrategyModal(true)}
              className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent text-secondary"
              aria-label="Strategy information"
            >
              <FiInfo size={10} className="md:hidden" />
              <FiInfo size={12} className="hidden md:block" />
            </button>
          </div>
        </div>
      </div>

      {/* Strategy Information Modal */}
      <AnimatePresence>
        {showStrategyModal && (
          <motion.div
            className="fixed inset-0 bg-foreground/30 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStrategyModal(false)}
          >
            <motion.div
              className="bg-background brutalist-box p-3 sm:p-6 max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-2"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Statistical Arbitrage</h3>
                <button
                  onClick={() => setShowStrategyModal(false)}
                  className="p-2 hover:bg-muted rounded-full"
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-6 text-foreground">
                <p className="text-xs text-muted-foreground italic">
                  Note: This is a simplified example of a statistical arbitrage
                  strategy. In practice, statistical arbitrage strategies are
                  more complex and involve multiple assets, sophisticated
                  models, and rigorous risk management. The simulation displayed
                  is exactly that, a simulation. It does not show the actual
                  performance of the strategy, but rather a visual
                  representation of the strategy's behavior.
                </p>
                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">
                    What is Statistical Arbitrage?
                  </h4>
                  <p>
                    Statistical arbitrage is a trading strategy that uses
                    mathematical models to identify temporary price
                    inefficiencies in the market. The core concept behind
                    statistical arbitrage is mean reversion, which assumes that
                    prices tend to move back toward their historical average
                    over time.
                  </p>
                  <p className="mt-3">
                    This strategy is commonly used by proprietary trading firms
                    and quantitative hedge funds to generate consistent returns
                    with relatively low risk, as it focuses on statistical
                    patterns rather than fundamental analysis or market timing.
                  </p>
                </div>

                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">Understanding Z-Scores</h4>
                  <p>
                    The foundation of our statistical arbitrage strategy is the
                    z-score. A z-score measures how many standard deviations a
                    particular value is from the mean of a dataset. In trading
                    terms, it helps us identify when an asset's price has
                    deviated significantly from its expected value.
                  </p>

                  <div className="my-4 brutalist-border bg-muted p-3 font-mono text-center">
                    z-score = (price - mean) / standard deviation
                  </div>

                  <p>
                    For example, if a stock typically trades around $100 (the
                    mean) with a standard deviation of $5, and the current price
                    is $110, the z-score would be:
                  </p>

                  <div className="my-3 brutalist-border bg-muted p-3 font-mono text-center">
                    ($110 - $100) / $5 = 2
                  </div>

                  <p>
                    This tells us the price is 2 standard deviations above the
                    mean, suggesting it may be overvalued and likely to revert
                    back toward $100.
                  </p>
                </div>

                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">Trading Signal Generation</h4>
                  <p>
                    In our algorithm, we generate trading signals based on the
                    calculated z-score and current market volatility. We use
                    dynamic thresholds that adjust based on market conditions:
                  </p>

                  <div className="my-3 brutalist-border bg-muted p-3 font-mono">
                    entryThreshold = 1.5 + (volatility * 0.5)
                    <br />
                    exitThreshold = 0.5
                  </div>

                  <p>
                    These thresholds help us determine when to enter and exit
                    positions:
                  </p>

                  <ul className="list-disc pl-5 space-y-2 mt-3">
                    <li>
                      <strong>Buy signal:</strong> When z-score &lt;
                      -entryThreshold, indicating the price is significantly
                      below its expected value and likely to rise.
                    </li>
                    <li>
                      <strong>Sell signal:</strong> When z-score &gt;
                      entryThreshold, indicating the price is significantly
                      above its expected value and likely to fall.
                    </li>
                    <li>
                      <strong>Exit signal:</strong> When |z-score| &lt;
                      exitThreshold, indicating the price has reverted close to
                      its expected value.
                    </li>
                  </ul>

                  <p className="mt-3">
                    It's important to note that the entry threshold increases
                    during periods of high volatility. This is because volatile
                    markets tend to have wider price swings, so we need stronger
                    signals to confirm a true mispricing rather than just market
                    noise.
                  </p>
                </div>

                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">Position Sizing</h4>
                  <p>
                    A critical aspect of any trading strategy is determining how
                    much to buy or sell. In our algorithm, we use a position
                    sizing approach inspired by the Kelly Criterion, which is a
                    formula used to determine the optimal size of a series of
                    bets.
                  </p>

                  <div className="my-3 brutalist-border bg-muted p-3 font-mono">
                    zscoreImpact = min(1, |z-score| / 4)
                    <br />
                    volImpact = max(0.1, 1 - volatility / 20)
                    <br />
                    position size = ceil(zscoreImpact * volImpact * 2) / 2
                  </div>

                  <p>Let's break down what this means:</p>

                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>zscoreImpact:</strong> Measures our conviction
                      based on how extreme the z-score is. A higher absolute
                      z-score indicates stronger evidence of mispricing.
                    </li>
                    <li>
                      <strong>volImpact:</strong> Reduces position size during
                      high volatility periods to manage risk. When markets are
                      turbulent, we take smaller positions.
                    </li>
                    <li>
                      <strong>position size:</strong> The final position size is
                      rounded to the nearest 0.5 for simplicity.
                    </li>
                  </ul>

                  <p className="mt-3">
                    For instance, with a z-score of -2.8 and volatility of 4,
                    our position sizing would be:
                  </p>

                  <div className="my-2 brutalist-border bg-muted p-3 font-mono">
                    zscoreImpact = min(1, |−2.8| / 4) = min(1, 0.7) = 0.7
                    <br />
                    volImpact = max(0.1, 1 - 4 / 20) = max(0.1, 0.8) = 0.8
                    <br />
                    position size = ceil(0.7 * 0.8 * 2) / 2 = ceil(1.12) / 2 =
                    1.5
                  </div>

                  <p className="mt-2">
                    This approach allows us to take larger positions when we
                    have higher conviction and market conditions are favorable,
                    while scaling back during uncertain times.
                  </p>
                </div>

                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">Volatility Measurement</h4>
                  <p>
                    Volatility plays a key role in our trading algorithm,
                    affecting both entry thresholds and position sizing. We
                    calculate volatility as the standard deviation of recent
                    price returns:
                  </p>

                  <div className="my-3 brutalist-border bg-muted p-3 font-mono text-center">
                    volatility = √(Σ(return - mean_return)² / n) * 100
                  </div>

                  <p>
                    Where "return" refers to the percentage price change between
                    consecutive periods. This measure gives us insight into how
                    much prices are fluctuating in the current market
                    environment.
                  </p>

                  <p className="mt-3">
                    Unlike some traditional techniques that use a fixed
                    volatility estimate, our approach continuously updates the
                    volatility measure as new price data arrives. This adaptive
                    approach helps our algorithm respond appropriately to
                    changing market conditions, becoming more conservative
                    during turbulent periods and more aggressive during stable
                    ones.
                  </p>
                </div>

                <div className="brutalist-border p-4">
                  <h4 className="font-bold mb-2">
                    Implementation Considerations
                  </h4>
                  <p>
                    In practice, implementing a statistical arbitrage strategy
                    requires additional considerations beyond what our
                    simplified model shows:
                  </p>

                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>
                      <strong>Transaction costs:</strong> Real-world trading
                      incurs fees that must be factored into expected returns.
                    </li>
                    <li>
                      <strong>Market impact:</strong> Large trades can move
                      prices against you, especially in less liquid markets.
                    </li>
                    <li>
                      <strong>Risk management:</strong> Additional stop-loss
                      mechanisms and portfolio-level risk controls are typically
                      used.
                    </li>
                    <li>
                      <strong>Correlation analysis:</strong> Production-level
                      systems often analyze correlations between multiple assets
                      to find more robust trading opportunities.
                    </li>
                  </ul>

                  <p className="mt-3">
                    The animation you're seeing demonstrates the core principles
                    of statistical arbitrage, but real-world implementations by
                    proprietary trading firms incorporate many additional layers
                    of sophistication and risk management.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
