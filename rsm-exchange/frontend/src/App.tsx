import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import './App.css'

interface PriceData {
  RSM: number
  SOL: number
  USDT: number
}

function App() {
  const { publicKey, connected } = useWallet()
  const [prices, setPrices] = useState<PriceData>({ RSM: 10000, SOL: 100, USDT: 1 })
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [fromToken, setFromToken] = useState('SOL')
  const [genomeStats, setGenomeStats] = useState({ total: 0, avg_consciousness: 0 })

  useEffect(() => {
    fetch('http://localhost:4000/api/prices')
      .then(res => res.json())
      .then(data => data.success && setPrices(data.prices))
      .catch(console.error)
    
    fetch('http://localhost:4000/api/genomes/stats')
      .then(res => res.json())
      .then(data => data.success && setGenomeStats(data.stats))
      .catch(console.error)
  }, [])

  const calculateOutput = (amount: string) => {
    const input = parseFloat(amount) || 0
    const rate = fromToken === 'SOL' ? 0.01 : 0.0001
    setToAmount((input * rate).toFixed(6))
  }

  const handleSwap = async () => {
    if (!connected) return alert('Connect wallet first!')
    alert(`Swap ${fromAmount} ${fromToken} → ${toAmount} RSM\n\nWallet: ${publicKey?.toBase58()}`)
  }

  const shortAddress = publicKey ? `${publicKey.toBase58().slice(0,4)}...${publicKey.toBase58().slice(-4)}` : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧬</span>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">
            RSM Exchange
          </h1>
        </div>
        <WalletMultiButton />
      </header>

      {/* Stats Bar */}
      <div className="flex justify-center gap-8 py-4 bg-black/30 flex-wrap">
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm">RSM Price</p>
          <p className="text-xl font-bold text-yellow-400">${prices.RSM.toLocaleString()}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm">Genomes</p>
          <p className="text-xl font-bold text-green-400">{Number(genomeStats.total).toLocaleString()}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm">Consciousness</p>
          <p className="text-xl font-bold text-purple-400">{genomeStats.avg_consciousness}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm">Market Cap</p>
          <p className="text-xl font-bold text-blue-400">$1T</p>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-lg mx-auto mt-8 p-4">
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-xl shadow-purple-900/20">
          <h2 className="text-xl font-bold mb-6 text-center">⚡ Swap</h2>
          
          {/* From */}
          <div className="bg-gray-900 rounded-xl p-4 mb-2">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-400">From</span>
              <span className="text-gray-400">Balance: 0.00</span>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => { setFromAmount(e.target.value); calculateOutput(e.target.value) }}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl outline-none text-white"
              />
              <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}
                className="bg-gray-700 px-4 py-2 rounded-lg font-semibold text-white">
                <option value="SOL">SOL</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center my-2">
            <button className="bg-gray-700 p-2 rounded-full hover:bg-gray-600 text-xl">⇅</button>
          </div>

          {/* To */}
          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-400">To</span>
              <span className="text-gray-400">Balance: 0.00</span>
            </div>
            <div className="flex gap-3">
              <input type="number" value={toAmount} readOnly placeholder="0.00"
                className="flex-1 bg-transparent text-2xl outline-none text-white" />
              <div className="bg-yellow-600 px-4 py-2 rounded-lg font-semibold">🧬 RSM</div>
            </div>
          </div>

          {/* Info */}
          <div className="text-sm text-gray-400 mb-4 space-y-1">
            <div className="flex justify-between"><span>Rate</span><span>1 RSM = 100 SOL</span></div>
            <div className="flex justify-between"><span>Fee</span><span>0.3%</span></div>
            {connected && <div className="flex justify-between"><span>Wallet</span><span className="text-green-400">{shortAddress}</span></div>}
          </div>

          {/* Button */}
          <button onClick={handleSwap} disabled={!fromAmount || !connected}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-lg text-black hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 transition">
            {connected ? 'Swap' : 'Connect Wallet'}
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">🧬 Wallet</p>
            <p className="font-bold text-green-400">{connected ? shortAddress : 'Not Connected'}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">⚡ Level</p>
            <p className="font-bold text-purple-400">{connected ? 'Awakening' : 'Level 0'}</p>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full p-4 text-center text-gray-500 text-sm">
        RSM Exchange v1.0 | Divine Kernel V12 | 🧬 Trade with Consciousness
      </footer>
    </div>
  )
}

export default App
