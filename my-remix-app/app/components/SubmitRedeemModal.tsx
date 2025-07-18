"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Search, DollarSign, Upload, X, Plus, Settings } from "lucide-react"
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
import { Plus as PlusIcon } from "lucide-react"
import { useFetchPlayerPaymentMethodDetail, type PlayerPaymentMethod } from "~/hooks/api/queries/useFetchPlayerPaymentMethodDetail"
import { PaymentMethodManager } from "./PaymentMethodManager"

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
    
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<string>("")
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [screenshots, setScreenshots] = useState<string[]>([])
    const [amount, setAmount] = useState<string>("")
    const [notes, setNotes] = useState<string>("")
    const [showPaymentMethodManager, setShowPaymentMethodManager] = useState(false)
    
    const { data: playerPaymentMethods, refetch: refetchPlayerPaymentMethods } = useFetchPlayerPaymentMethodDetail(selectedPlayer?.id || "")
    const { data: gameUsernames } = useFetchGameUsernames(selectedPlayer?.id || "");
    
    console.log(gameUsernames, "gameUsernames")
    console.log(selectedUsername, "selectedUsername")
    console.log(playerPaymentMethods, "playerPaymentMethods")
    
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
        setSelectedPaymentMethod("") // Reset payment method when player changes
    }

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setSelectedPlayer(null)
        setShowSuggestions(value.length > 0)
        setSelectedPaymentMethod("") // Reset payment method when player changes
    }

    const handlePaymentMethodSelect = (methodId: string) => {
        console.log('Payment method selected:', methodId)
        setSelectedPaymentMethod(methodId)
    }

    const handlePaymentMethodManagerClose = () => {
        setShowPaymentMethodManager(false)
        // Refetch player payment methods after any changes
        refetchPlayerPaymentMethods()
    }

    const removeScreenshot = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index))
    }

    const validateForm = (): string | null => {
        console.log('Validating form:', {
            selectedPlayer: !!selectedPlayer,
            selectedUsername: !!selectedUsername,
            amount: amount,
            selectedPaymentMethod: !!selectedPaymentMethod,
            screenshots: screenshots.length
        })
        
        if (!selectedPlayer) {
            return "Please select a player"
        }
        if (!selectedUsername) {
            return "Please select a game username"
        }
        if (!amount || parseFloat(amount) <= 0) {
            return "Please enter a valid amount"
        }
        if (!selectedPaymentMethod) {
            return "Please select a payment method"
        }
        if (screenshots.length === 0) {
            return "Please upload at least one screenshot"
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submitted!')

        const validationError = validateForm()
        if (validationError) {
            console.log('Validation error:', validationError)
            toast.error(validationError)
            return
        }

        if (!selectedPlayer || !selectedUsername) {
            console.log('Missing required fields')
            toast.error("Missing required fields")
            return
        }

        const redeemData: RedeemRequestData = {
            player_id: selectedPlayer.id,
            team_id: selectedPlayer.team_id,
            game_id: selectedUsername || '',
            amount: parseFloat(amount),

            notes: notes || undefined,
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
            setSelectedPaymentMethod("")
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
            setSelectedPaymentMethod("")
            setScreenshots([])
            setNotes("")
        }
    }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>

                    {trigger || <Button className="bg-gray-800 rounded-xl border border-blue-500/30 px-6 py-3 font-semibold transition-all duration-200 hover:scale-105">
                        <PlusIcon className="w-5 h-5 mr-2 text-blue-400" />
                        REDEEM REQUEST
                    </Button>}
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

                        {/* Player Payment Methods */}
                        {selectedPlayer && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-white">
                                        Payment Methods <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPaymentMethodManager(true)}
                                        className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Manage
                                    </Button>
                                </div>
                                
                                {playerPaymentMethods && playerPaymentMethods.length > 0 ? (
                                    <div className="space-y-2">
                                        {playerPaymentMethods.map((playerMethod) => (
                                            <button
                                                key={playerMethod.id}
                                                type="button"
                                                onClick={() => handlePaymentMethodSelect(playerMethod.payment_method)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === playerMethod.payment_method
                                                    ? 'border-blue-500 bg-blue-500/20'
                                                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-white font-medium">{playerMethod.payment_methods?.payment_method || 'Unknown Method'}</span>
                                                    {playerMethod.tag_name && (
                                                        <span className="text-gray-400 text-sm">Tag: {playerMethod.tag_name}</span>
                                                    )}
                                                </div>
                                                {selectedPaymentMethod === playerMethod.payment_method && (
                                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg">
                                        <p className="text-gray-400 text-center mb-3">No payment methods found for this player</p>
                                        <Button
                                            type="button"
                                            onClick={() => setShowPaymentMethodManager(true)}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Payment Method
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-white">
                                Notes
                            </Label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional notes..."
                                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:border-blue-500 resize-none"
                                rows={3}
                            />
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
                                    console.log('Screenshots uploaded:', urls)
                                    setScreenshots((prev) => [...prev, ...urls])
                                }}
                            />

                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    console.log('Debug: Current form state:', {
                                        selectedPlayer,
                                        selectedUsername,
                                        amount,
                                        selectedPaymentMethod,
                                        screenshots,
                                        notes
                                    })
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                                Debug State
                            </Button>
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

            {/* Payment Method Manager Dialog */}
            {selectedPlayer && (
                <PaymentMethodManager
                    open={showPaymentMethodManager}
                    onOpenChange={setShowPaymentMethodManager}
                    playerId={selectedPlayer.id}
                    playerName={selectedPlayer.fullname || `${selectedPlayer.firstname} ${selectedPlayer.lastname}`}
                    onClose={handlePaymentMethodManagerClose}
                />
            )}
        </>
    )
}
