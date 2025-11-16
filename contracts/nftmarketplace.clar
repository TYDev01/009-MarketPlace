;; title: NFT marketplace

;; token definitions
(define-non-fungible-token nft009market uint)

;; constants
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-TOKEN-NOT-FOUND (err u101))
(define-constant ERR-INVALID-ROYALTY (err u102))
(define-constant ERR-MINT-FAILED (err u103))
(define-constant ERR-INVALID-PRICE (err u104))
(define-constant ERR-NOT-LISTED (err u105))
(define-constant ERR-SELF-PURCHASE (err u106))

(define-constant BPS-DENOMINATOR u10000)
