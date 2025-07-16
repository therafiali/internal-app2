"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Search, DollarSign, Upload, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { useFetchPaymentMethods } from "~/hooks/api/queries/useFetchPaymentMethods"
import { useFetchPlayer } from "~/hooks/api/queries/useFetchPlayer"
import { useLoaderData } from "@remix-run/react"
import { useFetchGameUsernames } from "~/hooks/api/queries/useFetchGames"
import { useSubmitRedeemRequest, type RedeemRequestData } from "~/hooks/api/mutation/submit-redeem"
import UploadImages from "./shared/UploadImages"
import { toast } from "sonner"

interface PaymentMethod {
    id: string
    payment_method: string
}

interface Player {
    id: string
    firstname: string
    lastname: string
    fullname: string
    gender: string
    language: string
    messenger_id: string
    profilepic: string
    team_id: string
    timezone: string | null
    user_id: string
    vip_code: string
}

interface SubmitRedeemModalProps {
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function SubmitRedeemModal({
    trigger,
    open,
    onOpenChange,
}: SubmitRedeemModalProps) {
    const { data: paymentMethods } = useFetchPaymentMethods()
    const { data: players } = useFetchPlayer()
    const submitRedeemMutation = useSubmitRedeemRequest()

    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<string>("")
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [screenshots, setScreenshots] = useState<string[]>([])
    const [amount, setAmount] = useState<string>("")
    const [notes, setNotes] = useState<string>("")

    const { data: gameUsernames } = useFetchGameUsernames(selectedPlayer?.id || "");
    console.log(gameUsernames, "gameUsernames")
    console.log(selectedUsername, "selectedUsername")
    // Filter players based on search query
    const filteredPlayers = players?.filter((player: Player) =>
        `${player.firstname} ${player.lastname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    ) || []

    const handlePlayerSelect = (player: Player) => {
        setSelectedPlayer(player)
        setSearchQuery(`${player.firstname} ${player.lastname}`)
        setShowSuggestions(false)
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setSelectedPlayer(null)
        setShowSuggestions(value.length > 0)
    }

    const handlePaymentMethodToggle = (methodId: string) => {
        setSelectedPaymentMethods(prev =>
            prev.includes(methodId)
                ? prev.filter(id => id !== methodId)
                : [...prev, methodId]
        )
    }

    const removeScreenshot = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index))
    }

    const validateForm = (): string | null => {
        if (!selectedPlayer) {
            return "Please select a player"
        }
        if (!selectedUsername) {
            return "Please select a game username"
        }
        if (!amount || parseFloat(amount) <= 0) {
            return "Please enter a valid amount"
        }
        if (selectedPaymentMethods.length === 0) {
            return "Please select at least one payment method"
        }
        if (screenshots.length === 0) {
            return "Please upload at least one screenshot"
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        if (!selectedPlayer || !selectedUsername) {
            toast.error("Missing required fields")
            return
        }

        const redeemData: RedeemRequestData = {
            player_id: selectedPlayer.id,
            team_id: selectedPlayer.team_id,
            game_id: selectedUsername|| '',
            amount: parseFloat(amount),
        }

        try {
            console.log('Submitting redeem data:', redeemData)
            await submitRedeemMutation.mutateAsync(redeemData)
            toast.success("Redeem request submitted successfully!")
            
            // Reset form
            setSelectedPlayer(null)
            setSearchQuery("")
            setSelectedUsername("")
            setAmount("")
            setSelectedPaymentMethods([])
            setScreenshots([])
            setNotes("")
            
            // Close modal
            onOpenChange?.(false)
        } catch (error) {
            console.error('Submit redeem error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit redeem request. Please try again.'
            toast.error(errorMessage)
        }
    }

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedPlayer(null)
            setSearchQuery("")
            setSelectedUsername("")
            setAmount("")
            setSelectedPaymentMethods([])
            setScreenshots([])
            setNotes("")
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || <Button>Redeem Request</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                        Submit Redeem Request
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Search Player */}
                    <div className="space-y-2">
                        <Label htmlFor="player-search" className="text-white">
                            Search Player <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="player-search"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search by Name or Account ID"
                                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                                required
                            />

                            {/* Player Suggestions */}
                            {showSuggestions && filteredPlayers.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {filteredPlayers.map((player: Player) => (
                                        <button
                                            key={player.id}
                                            type="button"
                                            onClick={() => handlePlayerSelect(player)}
                                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors border-b border-gray-600 last:border-b-0"
                                        >
                                            {player.fullname || `${player.firstname} ${player.lastname}`}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No results message */}
                            {showSuggestions && searchQuery.length > 0 && filteredPlayers.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4">
                                    <p className="text-gray-400 text-center">No players found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Game Usernames */}
                    {selectedPlayer && gameUsernames?.data && gameUsernames.data.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-white">
                                Game Usernames <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2">
                                {gameUsernames.data.map((game) => (
                                    <button
                                        key={game.id}
                                        type="button"
                                        onClick={() => setSelectedUsername(game.games.id || '')}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${selectedUsername === (game.id || '')
                                            ? 'border-blue-500 bg-blue-500/20'
                                            : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                            }`}
                                    >
                                        <div>
                                            <p className="text-white font-medium">{game.games.game_name}</p>
                                            <p className="text-gray-400 text-sm">{game.username || 'No username set'}</p>
                                        </div>
                                        {selectedUsername === (game.games.id || '') && (
                                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-white">
                            Amount <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount..."
                                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                        <Label className="text-white">
                            Payment Methods <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods?.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => handlePaymentMethodToggle(method.id)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedPaymentMethods.includes(method.id)
                                        ? 'border-blue-500 bg-blue-500/20'
                                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                        }`}
                                >
                                    <span className="text-white font-medium">{method.payment_method}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Screenshots */}
                    <div className="space-y-2">
                        <Label className="text-white">
                            Screenshots <span className="text-red-500">*</span>
                        </Label>
                        <UploadImages 
                            bucket="redeem-requests-screenshots" 
                            numberOfImages={8} 
                            onUpload={(urls) => {
                                setScreenshots((prev) => [...prev, ...urls])
                            }} 
                        />
                    
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={submitRedeemMutation.isPending}
                        >
                            {submitRedeemMutation.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Submit Redeem Request"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
