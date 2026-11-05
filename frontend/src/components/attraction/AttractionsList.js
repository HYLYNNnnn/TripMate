import { Box } from "@mui/material";
import AttractionCardWithPhoto from "./AttractionCardWithPhoto";
import AttractionCardSkeleton from "./AttractionCardSkeleton";

export default function AttractionsList({ attractions, loading, onClick, selected, onSelected }) {
  const fakeData = new Array(10).fill(true);
  return <>
    {
      loading ?
        fakeData.map((_, index) => (
          <Box mb={2} key={index}> <AttractionCardSkeleton></AttractionCardSkeleton></Box>
        ))
        :
        attractions?.map((attraction) => (
          <Box mb={2} key={attraction.marker_id}>
            <AttractionCardWithPhoto
              attraction={attraction}
              selected={selected.includes(attraction.place_id)}
              onClick={() => onClick(attraction)}
              onSelected={() => onSelected?.(attraction)}
            />
          </Box>
        ))
    }
  </>
}