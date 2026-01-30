# BMT University Course Data

This directory contains all course content for BMT University, organized for portability and version control.

## Folder Structure

```
data/
├── courses.json           # All course data (lessons, quizzes, questions)
├── asset-manifest.json    # Maps every file to its course/lesson
├── README.md
│
├── thumbnails/            # COURSE THUMBNAILS (one per course)
│   ├── bmt_jar_racing_meme.png           → Bitcoin vs Kaspa course
│   ├── bmt_jar_professor_meme.png        → DAG Terminology course
│   ├── bmt_jar_holding_kaspa_coin.png    → DAG and Kaspa course
│   ├── bmt_jar_bridge_cyan_kaspa.png     → Bridging L1 to L2 course
│   ├── bmt_jar_with_key_wallet.png       → Self-Custody course
│   ├── bmt_jar_gold_dollar_scale.png     → Sound Money course
│   ├── bmt_jar_teaching_dag_fundamentals.png → Foundational Concepts course
│   ├── bmt_jar_with_data_structures.png  → Core Data Structures course
│   ├── bmt_jar_ghostdag_ghost_theme.png  → GHOSTDAG Mechanics course
│   ├── bmt_jar_with_settings_gears.png   → Consensus Parameters course
│   ├── bmt_jar_block_processing_factory.png → Block Processing course
│   ├── bmt_jar_balancing_difficulty.png  → Difficulty Adjustment course
│   ├── bmt_jar_processing_transactions.png → Transaction Processing course
│   ├── bmt_jar_pruning_digital_garden.png → Anticone Finalization course
│   ├── bmt_jar_cleaning_pruning_system.png → Pruning System course
│   ├── bmt_jar_virtual_reality_state.png → Virtual State course
│   ├── bmt_jar_security_shield_knight.png → Finality & Security course
│   ├── bmt_jar_with_clock_timestamps.png → Timestamps course
│   └── bmt_jar_rocket_network_scaling.png → Network & Scaling course
│
├── lesson-images/         # LESSON-SPECIFIC IMAGES (organized by course)
│   │
│   ├── dag-and-kaspa/     # For "DAG and Kaspa: Understanding the Structure"
│   │   ├── dag_graph_undirected.png   → "What is a Graph" lesson
│   │   ├── dag_graph_directed.png     → "What is a Directed Graph" lesson
│   │   ├── dag_graph_acyclic.png      → "What is an Acyclic Graph" lesson
│   │   ├── dag_bitcoin_chain.png      → "Bitcoin's Linear Chain" lesson
│   │   ├── dag_kaspa_blockdag.png     → "Kaspa's BlockDAG" lesson
│   │   └── dag_blocks_learning_meme.png → General DAG learning image
│   │
│   └── bitcoin-vs-kaspa/  # For "Bitcoin vs Kaspa" course
│       └── bitcoin_vs_kaspa_speed_meme.png → Speed comparison lesson
│
└── videos/
    ├── lessons/           # LESSON VIDEOS (embedded in course content)
    │   ├── 9wXZuu-ZPXva7ncY_1765086712491.mp4
    │   └── vAOXqFGD2JBUhEC1_1765086579605.mp4
    │
    └── promo/             # PROMOTIONAL VIDEOS (marketing use)
        ├── bmt_university_crypto_promo_teaser.mp4
        ├── bmt_university_kaspa_branded_promo.mp4
        ├── bmt_university_title_card_reveal.mp4
        └── kaspa_blockdag_visuals_no_text.mp4
```

## Content Summary

| Type | Count |
|------|-------|
| Courses | 20 |
| Lessons | 88 |
| Quizzes | 20 |
| Quiz Questions | 158 |
| Course Thumbnails | 25 |
| Lesson Images | 7 |
| Lesson Videos | 2 local + 4 YouTube |
| Promo Videos | 4 |

## File Descriptions

### courses.json
Complete course data including lessons, quizzes, and all quiz questions with answers.

### asset-manifest.json
Detailed mapping of every media file to its associated course/lesson. Use this to:
- Find which course uses which thumbnail
- Find which lesson uses which image
- Map video files to their original asset paths

## Path References in courses.json

Thumbnails reference: `/assets/generated_images/bmt_jar_*.png`
- Actual location: `data/thumbnails/bmt_jar_*.png`

Lesson videos reference: `/assets/*.mp4`
- Actual location: `data/videos/lessons/*.mp4`

YouTube videos: External links (no local files)

## Quick Reference: Thumbnail → Course

| Thumbnail | Course |
|-----------|--------|
| bmt_jar_racing_meme.png | Bitcoin vs Kaspa: The Next Evolution |
| bmt_jar_professor_meme.png | DAG Terminology |
| bmt_jar_holding_kaspa_coin.png | DAG and Kaspa: Understanding the Structure |
| bmt_jar_bridge_cyan_kaspa.png | Bridging Kaspa L1 to Kasplex L2 |
| bmt_jar_with_key_wallet.png | Self-Custody & Hardware Wallets |
| bmt_jar_gold_dollar_scale.png | Sound Money & Monetary Debasement |
| bmt_jar_teaching_dag_fundamentals.png | Foundational Concepts |
| bmt_jar_with_data_structures.png | Core Data Structures |
| bmt_jar_ghostdag_ghost_theme.png | GHOSTDAG Mechanics |
| bmt_jar_with_settings_gears.png | Consensus Parameters |
| bmt_jar_block_processing_factory.png | Block Processing |
| bmt_jar_balancing_difficulty.png | Difficulty Adjustment (DAA) |
| bmt_jar_processing_transactions.png | Transaction Processing |
| bmt_jar_pruning_digital_garden.png | Anticone Finalization & Safe Pruning |
| bmt_jar_cleaning_pruning_system.png | Pruning System |
| bmt_jar_virtual_reality_state.png | Virtual State |
| bmt_jar_security_shield_knight.png | Finality & Security + MEV Solutions |
| bmt_jar_with_clock_timestamps.png | Timestamps & Median Time |
| bmt_jar_rocket_network_scaling.png | Network & Scaling |

## Quick Reference: Lesson Images → Lessons

### DAG and Kaspa Course
| Image | Lesson Topic |
|-------|--------------|
| dag_graph_undirected.png | What is a Graph |
| dag_graph_directed.png | What is a Directed Graph |
| dag_graph_acyclic.png | What is an Acyclic Graph |
| dag_bitcoin_chain.png | Bitcoin's Linear Chain |
| dag_kaspa_blockdag.png | Kaspa's BlockDAG |

### Bitcoin vs Kaspa Course
| Image | Lesson Topic |
|-------|--------------|
| bitcoin_vs_kaspa_speed_meme.png | Speed Comparison |

## Export Date
Last exported: January 30, 2026
