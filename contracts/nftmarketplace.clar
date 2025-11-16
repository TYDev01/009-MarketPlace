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

;; data vars
(define-data-var last-token-id uint u0)

;; data maps
(define-map token-metadata uint
  {
    uri: (optional (string-ascii 200)),
    creator: principal,
    royalty-bps: uint
  }
)

(define-map listings uint { price: uint, seller: principal })

;; public functions

;; Mint a new NFT with metadata and royalty settings
;; @param recipient: principal address to receive the NFT
;; @param metadata-uri: optional URI pointing to token metadata
;; @param royalty-bps: royalty percentage in basis points (0-10000, where 10000 = 100%)
;; @returns: (ok token-id) on success
(define-public (mint (recipient principal) (metadata-uri (optional (string-ascii 200))) (royalty-bps uint))
  (begin
    (asserts! (<= royalty-bps BPS-DENOMINATOR) ERR-INVALID-ROYALTY)
    (let ((next-id (+ (var-get last-token-id) u1)))
      (begin
        (var-set last-token-id next-id)
        (unwrap! (nft-mint? nft009market next-id recipient) ERR-MINT-FAILED)
        (map-set token-metadata next-id {
          uri: metadata-uri,
          creator: tx-sender,
          royalty-bps: royalty-bps
        })
        (ok next-id)
      )
    )
  )
)

;; List an NFT for sale on the marketplace
;; @param token-id: the ID of the NFT to list
;; @param price: listing price in microSTX (must be greater than 0)
;; @returns: (ok token-id) on success
;; Only the current owner can list their NFT
(define-public (list-token (token-id uint) (price uint))
  (let ((owner (unwrap! (nft-get-owner? nft009market token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (> price u0) ERR-INVALID-PRICE)
      (asserts! (is-eq owner tx-sender) ERR-NOT-OWNER)
      (map-set listings token-id {
        price: price,
        seller: tx-sender
      })
      (ok token-id)
    )
  )
)

;; Update the price of an existing listing
;; @param token-id: the ID of the listed NFT
;; @param new-price: new listing price in microSTX (must be greater than 0)
;; @returns: (ok token-id) on success
;; Only the current seller can update their listing
(define-public (update-listing (token-id uint) (new-price uint))
  (let ((listing (unwrap! (map-get? listings token-id) ERR-NOT-LISTED)))
    (begin
      (asserts! (is-eq (get seller listing) tx-sender) ERR-NOT-OWNER)
      (asserts! (> new-price u0) ERR-INVALID-PRICE)
      (map-set listings token-id {
        price: new-price,
        seller: tx-sender
      })
      (ok token-id)
    )
  )
)
