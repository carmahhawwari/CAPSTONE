import type { ReceiptBlock, ReceiptImageBlock, ReceiptTextBlock, ReceiptWordArtBlock } from '@/types';

let receiptBlockCounter = 0;

function makeReceiptBlockId(prefix: ReceiptBlock['type']) {
  receiptBlockCounter += 1;
  return `${prefix}-${Date.now()}-${receiptBlockCounter}`;
}

export function createTextBlock(): ReceiptTextBlock {
  return {
    id: makeReceiptBlockId('text'),
    type: 'text',
    text: '',
    fontId: 'soft',
    size: 18,
  };
}

export function createWordArtBlock(): ReceiptWordArtBlock {
  return {
    id: makeReceiptBlockId('word-art'),
    type: 'word-art',
    text: 'Word art',
    fontId: 'letter',
    size: 34,
    weight: 'black',
    transform: 'uppercase',
  };
}

export function createImageBlock(): ReceiptImageBlock {
  return {
    id: makeReceiptBlockId('image'),
    type: 'image',
    src: '',
    name: '',
  };
}

export function flattenReceiptBlocks(blocks: ReceiptBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'image') {
        return block.name ? `[Image: ${block.name}]` : '[Image]';
      }

      return block.text.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

export function hasMeaningfulReceiptBlock(block: ReceiptBlock) {
  if (block.type === 'image') {
    return Boolean(block.src.trim());
  }

  return Boolean(block.text.trim());
}

export function receiptBlocksHaveContent(blocks: ReceiptBlock[]) {
  return blocks.some((block) => hasMeaningfulReceiptBlock(block));
}

export function getFirstReceiptImageName(blocks: ReceiptBlock[]) {
  return blocks.find((block): block is ReceiptImageBlock => block.type === 'image' && Boolean(block.name.trim()))?.name;
}